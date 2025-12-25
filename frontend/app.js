// API Configuration
const API_URL = 'http://localhost:3000';

// Form elements
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const loader = document.getElementById('loader');
const message = document.getElementById('message');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const privateKey = document.getElementById('privateKey');
const usersList = document.getElementById('usersList');

// Load and display registered users
async function loadRegisteredUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`);
        if (!response.ok) return;
        
        const users = await response.json();
        
        if (!users || users.length === 0) {
            usersList.innerHTML = '<p class="no-users">No users registered yet. Add your first user below!</p>';
            return;
        }
        
        usersList.innerHTML = users.map(user => `
            <div class="user-card">
                <h4>👤 ${user.name}</h4>
                <p>📱 ${user.phone}</p>
                <p>💼 ${user.address.substring(0, 10)}...${user.address.slice(-6)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load users on page load
window.addEventListener('DOMContentLoaded', loadRegisteredUsers);

// Generate a new wallet (keypair)
async function generateWallet() {
    // In a real app, this would use the Aptos SDK
    // For now, we'll make a request to the backend to generate it
    try {
        const response = await fetch(`${API_URL}/api/generate-wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate wallet');
        }

        return await response.json();
    } catch (error) {
        console.error('Wallet generation error:', error);
        throw error;
    }
}

// Fund account via faucet
async function fundAccount(address) {
    try {
        const response = await fetch(`${API_URL}/api/fund-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: address
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Funding failed');
        }

        return data;
    } catch (error) {
        console.error('Funding error:', error);
        throw error;
    }
}

// Register user with phone number
async function registerUser(name, phone, privateKeyHex, address) {
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                privateKey: privateKeyHex,
                address: address
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Show/hide private key field based on wallet address input
document.getElementById('walletAddress').addEventListener('input', (e) => {
    const privateKeyGroup = document.getElementById('privateKeyGroup');
    if (e.target.value.trim()) {
        privateKeyGroup.style.display = 'block';
        document.getElementById('privateKeyInput').required = true;
    } else {
        privateKeyGroup.style.display = 'none';
        document.getElementById('privateKeyInput').required = false;
    }
});

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const existingAddress = document.getElementById('walletAddress').value.trim();
    const existingPrivateKey = document.getElementById('privateKeyInput').value.trim();

    // Validate phone format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
        showMessage('Please enter a valid phone number in E.164 format (e.g., +919545296699)', 'error');
        return;
    }

    // Validate name
    if (name.length < 2) {
        showMessage('Please enter a valid name (at least 2 characters)', 'error');
        return;
    }

    // Disable form
    registerBtn.disabled = true;
    registerBtn.textContent = 'Processing...';
    loader.style.display = 'block';
    message.style.display = 'none';
    walletInfo.style.display = 'none';

    try {
        let wallet;
        
        if (existingAddress && existingPrivateKey) {
            // Use existing wallet
            showMessage('🔐 Using existing wallet...', 'success');
            wallet = {
                address: existingAddress,
                privateKey: existingPrivateKey
            };
            
            // Fund the account if needed
            registerBtn.textContent = 'Funding Account...';
            showMessage('💰 Ensuring account has funds...', 'success');
            await fundAccount(existingAddress);
        } else {
            // Step 1: Generate new wallet
            showMessage('🔐 Generating secure wallet...', 'success');
            wallet = await generateWallet();
            
            // Step 2: Fund the new wallet
            registerBtn.textContent = 'Funding Account...';
            showMessage('💰 Funding your account...', 'success');
            await fundAccount(wallet.address);
        }

        // Step 3: Register on blockchain
        registerBtn.textContent = 'Registering on Blockchain...';
        showMessage('⛓️ Registering on Movement Network...', 'success');
        
        const result = await registerUser(name, phone, wallet.privateKey, wallet.address);

        // Step 4: Show success
        registerBtn.textContent = '✅ Registration Complete!';
        showMessage(`✅ Successfully registered ${name}! You can now add another user or start sending payments via WhatsApp.`, 'success');
        
        // Display wallet info if it's a new wallet
        if (!existingAddress) {
            walletAddress.textContent = wallet.address;
            privateKey.textContent = wallet.privateKey;
            walletInfo.style.display = 'block';
        }

        // Reload registered users list
        await loadRegisteredUsers();

        // Clear form for next registration
        setTimeout(() => {
            registerForm.reset();
            walletInfo.style.display = 'none';
            message.style.display = 'none';
            registerBtn.textContent = 'Create Wallet & Register';
            registerBtn.disabled = false;
        }, 3000);

    } catch (error) {
        showMessage(`❌ Error: ${error.message}`, 'error');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Wallet & Register';
    } finally {
        loader.style.display = 'none';
    }
});

// Show message
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
}

// Copy address to clipboard
function copyAddress() {
    const address = walletAddress.textContent;
    navigator.clipboard.writeText(address).then(() => {
        alert('✅ Address copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Copy private key to clipboard
function copyPrivateKey() {
    const key = privateKey.textContent;
    navigator.clipboard.writeText(key).then(() => {
        alert('✅ Private key copied to clipboard!\n\n⚠️ Keep this safe and never share it!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Don't auto-display - let user register fresh each time
// They can view their saved wallet info if they want, but shouldn't block registration
window.addEventListener('load', () => {
    // Clear any old localStorage to allow fresh registration
    // Users can save their keys separately if needed
    console.log('ChatterPay registration page loaded');
});
