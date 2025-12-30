module Flux::phone_registry {
    use std::vector;
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;

    /// Error codes
    const E_PHONE_ALREADY_REGISTERED: u64 = 1;
    const E_PHONE_NOT_FOUND: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_REGISTRY_NOT_INITIALIZED: u64 = 4;

    /// Simple entry mapping a phone_hash (vector<u8>) to an owner address with name
    struct Entry has copy, drop, store {
        phone_hash: vector<u8>,
        owner: address,
        name: vector<u8>,  // User's display name
    }

    /// Registry stored under the deployer account
    struct Registry has key {
        entries: vector<Entry>,
        register_events: EventHandle<UserRegisteredEvent>,
        payment_events: EventHandle<PaymentSentEvent>,
    }

    /// Event emitted when a user registers their phone
    struct UserRegisteredEvent has drop, store {
        phone_hash: vector<u8>,
        address: address,
        name: vector<u8>,
        timestamp: u64,
    }

    /// Event emitted when a payment is sent
    struct PaymentSentEvent has drop, store {
        from: address,
        to: address,
        amount: u64,
        timestamp: u64,
    }

    /// Initialize registry for account (call once from deployer)
    public entry fun init_registry(account: &signer) {
        let acct = signer::address_of(account);
        if (!exists<Registry>(acct)) {
            move_to(account, Registry { 
                entries: vector::empty<Entry>(),
                register_events: account::new_event_handle<UserRegisteredEvent>(account),
                payment_events: account::new_event_handle<PaymentSentEvent>(account),
            });
        }
    }

    /// Helper: bytewise vector equality
    fun vec_equal(a: &vector<u8>, b: &vector<u8>): bool {
        let la = vector::length(a);
        let lb = vector::length(b);
        if (la != lb) { return false; };
        
        let i = 0;
        while (i < la) {
            let aa = *vector::borrow(a, i);
            let bb = *vector::borrow(b, i);
            if (aa != bb) { return false; };
            i = i + 1;
        };
        true
    }

    /// Register the caller's address under `phone_hash`
    /// Fails if the phone is already registered
    public entry fun register_user(account: &signer, registry_addr: address, phone_hash: vector<u8>, name: vector<u8>) 
    acquires Registry {
        assert!(exists<Registry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        // Check if phone already registered
        let reg_ref = borrow_global_mut<Registry>(registry_addr);
        let len = vector::length(&reg_ref.entries);
        let i = 0;
        while (i < len) {
            let entry = vector::borrow(&reg_ref.entries, i);
            if (vec_equal(&entry.phone_hash, &phone_hash)) {
                abort E_PHONE_ALREADY_REGISTERED
            };
            i = i + 1;
        };
        
        // Register new entry
        let caller = signer::address_of(account);
        let new_entry = Entry { phone_hash: phone_hash, owner: caller, name: name };
        vector::push_back(&mut reg_ref.entries, new_entry);
        
        // Emit registration event
        event::emit_event(
            &mut reg_ref.register_events,
            UserRegisteredEvent {
                phone_hash,
                address: caller,
                name,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Update phone hash for caller
    public entry fun update_user(account: &signer, registry_addr: address, new_phone_hash: vector<u8>, name: vector<u8>) 
    acquires Registry {
        assert!(exists<Registry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let caller = signer::address_of(account);
        let reg_ref = borrow_global_mut<Registry>(registry_addr);
        let len = vector::length(&reg_ref.entries);
        
        // First remove old entry (if any)
        let i = 0;
        while (i < len) {
            let entry = vector::borrow(&reg_ref.entries, i);
            if (entry.owner == caller) {
                // Delete by swapping with last element and popping
                vector::swap_remove(&mut reg_ref.entries, i);
                break;
            };
            i = i + 1;
        };
        
        // Add new entry
        let new_entry = Entry { phone_hash: new_phone_hash, owner: caller, name: name };
        vector::push_back(&mut reg_ref.entries, new_entry);
        
        // Emit registration event (for update)
        event::emit_event(
            &mut reg_ref.register_events,
            UserRegisteredEvent {
                phone_hash: new_phone_hash,
                address: caller,
                name,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    /// Lookup owner by phone_hash in the registry
    public fun get_user(registry_addr: address, phone_hash: vector<u8>): address 
    acquires Registry {
        assert!(exists<Registry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let reg_ref = borrow_global<Registry>(registry_addr);
        let len = vector::length(&reg_ref.entries);
        let i = 0;
        while (i < len) {
            let entry = vector::borrow(&reg_ref.entries, i);
            if (vec_equal(&entry.phone_hash, &phone_hash)) {
                return entry.owner;
            };
            i = i + 1;
        };
        abort E_PHONE_NOT_FOUND
    }

    /// Send payment to a user identified by their phone_hash
    public entry fun send_payment(
        sender: &signer, 
        registry_addr: address, 
        receiver_phone_hash: vector<u8>, 
        amount: u64
    ) acquires Registry {
        // Get recipient's address from registry
        let recipient_addr = get_user(registry_addr, receiver_phone_hash);
        
        // Transfer APT from sender to recipient
        coin::transfer<AptosCoin>(sender, recipient_addr, amount);
        
        // Emit payment event
        let sender_addr = signer::address_of(sender);
        let reg_ref = borrow_global_mut<Registry>(registry_addr);
        event::emit_event(
            &mut reg_ref.payment_events,
            PaymentSentEvent {
                from: sender_addr,
                to: recipient_addr,
                amount,
                timestamp: timestamp::now_seconds(),
            }
        );
    }
}

#[test_only]
module Flux::phone_registry_tests {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use Flux::phone_registry;

    // Test phone numbers (hashed)
    const PHONE1: vector<u8> = vector[1, 2, 3, 4];
    const PHONE2: vector<u8> = vector[5, 6, 7, 8];

    #[test(registry = @Flux, user1 = @0x123, user2 = @0x456, aptos_framework = @aptos_framework)]
    fun test_register_and_payment(
        registry: &signer,
        user1: &signer,
        user2: &signer,
        aptos_framework: &signer
    ) {
        // Setup test environment
        let registry_addr = signer::address_of(registry);
        account::create_account_for_test(registry_addr);
        account::create_account_for_test(signer::address_of(user1));
        account::create_account_for_test(signer::address_of(user2));

        // Initialize timestamp and coin
        timestamp::set_time_has_started_for_testing(aptos_framework);
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        phone_registry::init_registry(registry);
        
        // Register user1 and user2
        phone_registry::register_user(user1, registry_addr, PHONE1);
        phone_registry::register_user(user2, registry_addr, PHONE2);
        
        // Verify lookup works
        assert!(phone_registry::get_user(registry_addr, PHONE1) == signer::address_of(user1), 0);
        assert!(phone_registry::get_user(registry_addr, PHONE2) == signer::address_of(user2), 1);
        
        // Setup coins for user1
        let amount = 1000000;
        coin::register<AptosCoin>(user1);
        coin::register<AptosCoin>(user2);
        let coins = coin::mint<AptosCoin>(amount, &mint_cap);
        coin::deposit(signer::address_of(user1), coins);
        
        // Send payment from user1 to user2 by phone
        phone_registry::send_payment(user1, registry_addr, PHONE2, 500000);
        
        // Verify balances
        assert!(coin::balance<AptosCoin>(signer::address_of(user1)) == 500000, 2);
        assert!(coin::balance<AptosCoin>(signer::address_of(user2)) == 500000, 3);
        
        // Clean up capabilities
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(registry = @Flux, user1 = @0x123, aptos_framework = @aptos_framework)]
    fun test_update_user(registry: &signer, user1: &signer, aptos_framework: &signer) {
        // Setup test environment
        let registry_addr = signer::address_of(registry);
        account::create_account_for_test(registry_addr);
        account::create_account_for_test(signer::address_of(user1));
        
        // Initialize timestamp
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize the registry
        phone_registry::init_registry(registry);
        
        // Register user1
        phone_registry::register_user(user1, registry_addr, PHONE1);
        
        // Update user1's phone
        phone_registry::update_user(user1, registry_addr, PHONE2);
        
        // Verify old phone no longer works and new one does
        assert!(phone_registry::get_user(registry_addr, PHONE2) == signer::address_of(user1), 0);
    }
}



//Private_key: "0x74c2ac8ec286c81be43dfc3175ca9df543c3390c208d816d857db3704c375bf8"
   // public_key: "0xaf13cc534d7c5097437fb52fd7dc3ce7c8e865be2b8e244979830b7d4187a6bf"
    //account: 7a9ea50052a16a735b75491d961ac61d9eae45584c1f789a4d93d99132c240a9
    //rest_url: "https://fullnode.testnet.aptoslabs.com"
    //faucet_url: "https://faucet.testnet.aptoslabs.com"
    //0x74c2ac8ec286c81be43dfc3175ca9df543c3390c208d816d857db3704c375bf8
    //0x74c2ac8ec286c81be43dfc3175ca9df543c3390c208d816d857db3704c375bf8- SERVER_PRIVATE_KEY - 