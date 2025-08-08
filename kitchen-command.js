// Fort Kitchen Command - Decision-Free Meal Management System
// JavaScript functionality for pantry tracking, recipe management, and shopping lists

let pantryInventory = [
    'Pasta', 'Tomato Sauce', 'Ground Turkey', 'Onions', 'Garlic', 
    'Bell Peppers', 'Rice', 'Black Beans', 'Spinach', 'Cheese'
];

let approvedRecipes = [
    {
        id: 'turkey-pasta',
        name: 'Turkey & Vegetable Pasta',
        ingredients: ['Ground Turkey', 'Pasta', 'Bell Peppers', 'Onions', 'Garlic', 'Tomato Sauce', 'Spinach'],
        prepTime: 25,
        approved: true,
        notes: 'Quick weeknight meal, all ingredients usually in stock',
        instructions: [
            'Brown ground turkey in large pan',
            'Add diced onions and garlic, cook 3 minutes',
            'Add bell peppers, cook 5 minutes',
            'Stir in tomato sauce, simmer 10 minutes',
            'Add cooked pasta and spinach, toss together',
            'Serve immediately'
        ]
    },
    {
        id: 'rice-bowl',
        name: 'Black Bean Rice Bowl',
        ingredients: ['Rice', 'Black Beans', 'Bell Peppers', 'Onions', 'Cheese', 'Spinach'],
        prepTime: 20,
        approved: true,
        notes: 'Healthy, filling, easy cleanup',
        instructions: [
            'Cook rice according to package directions',
            'Sauté onions and bell peppers until soft',
            'Heat black beans with vegetables',
            'Serve over rice with spinach and cheese',
            'Add hot sauce if desired'
        ]
    },
    {
        id: 'stir-fry',
        name: 'Stir-Fry Vegetables',
        ingredients: ['Mixed Vegetables', 'Rice', 'Soy Sauce', 'Garlic', 'Ginger'],
        prepTime: 15,
        approved: false,
        notes: 'Need to check with Chris on sauce preferences'
    }
];

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Pantry Management Functions
function uploadPantryPhotos(event) {
    const files = event.target.files;
    if (files.length > 0) {
        // Simulate AI image recognition
        showLoadingMessage('Analyzing pantry photos with AI...');
        
        setTimeout(() => {
            // Simulate detected items
            const detectedItems = [
                'Pasta', 'Tomato Sauce', 'Ground Turkey', 'Onions', 'Garlic',
                'Bell Peppers', 'Rice', 'Black Beans', 'Spinach', 'Cheese',
                'Bread', 'Eggs', 'Milk', 'Carrots', 'Broccoli'
            ];
            
            // Update pantry inventory
            pantryInventory = [...new Set([...pantryInventory, ...detectedItems])];
            updateInventoryDisplay();
            
            hideLoadingMessage();
            showSuccessMessage(`✅ Detected ${detectedItems.length} items in your pantry!`);
        }, 2000);
    }
}

function updateInventoryDisplay() {
    const inventoryContainer = document.getElementById('current-inventory');
    inventoryContainer.innerHTML = '';
    
    pantryInventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.textContent = item;
        itemDiv.onclick = () => removeInventoryItem(item);
        itemDiv.title = 'Click to remove';
        inventoryContainer.appendChild(itemDiv);
    });
}

function removeInventoryItem(item) {
    if (confirm(`Remove "${item}" from pantry?`)) {
        pantryInventory = pantryInventory.filter(i => i !== item);
        updateInventoryDisplay();
        updateMealSuggestions();
    }
}

function manualAddInventory() {
    const item = prompt('Add item to pantry:');
    if (item && item.trim()) {
        pantryInventory.push(item.trim());
        updateInventoryDisplay();
        updateMealSuggestions();
        showSuccessMessage(`Added "${item}" to pantry!`);
    }
}

// Recipe Management Functions
function addNewRecipe() {
    const recipeName = prompt('Recipe name:');
    if (!recipeName) return;
    
    const ingredients = prompt('Ingredients (comma-separated):');
    if (!ingredients) return;
    
    const prepTime = parseInt(prompt('Prep time (minutes):'));
    if (!prepTime) return;
    
    const notes = prompt('Notes (optional):') || '';
    
    const newRecipe = {
        id: recipeName.toLowerCase().replace(/\s+/g, '-'),
        name: recipeName,
        ingredients: ingredients.split(',').map(i => i.trim()),
        prepTime: prepTime,
        approved: false,
        notes: notes
    };
    
    approvedRecipes.push(newRecipe);
    updateRecipeDisplay();
    showSuccessMessage(`Added recipe "${recipeName}" - needs Chris approval!`);
}

function requestApproval() {
    const pendingRecipes = approvedRecipes.filter(r => !r.approved);
    if (pendingRecipes.length === 0) {
        showInfoMessage('All recipes are already approved!');
        return;
    }
    
    // Simulate sending approval request
    showInfoMessage(`📧 Approval request sent to Chris for ${pendingRecipes.length} recipes!`);
    
    // For demo, auto-approve after 3 seconds
    setTimeout(() => {
        pendingRecipes.forEach(recipe => {
            recipe.approved = true;
        });
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage('🎉 Chris approved the recipes!');
    }, 3000);
}

function updateRecipeDisplay() {
    // This would update the recipe cards in the DOM
    console.log('Updating recipe display with', approvedRecipes.length, 'recipes');
}

// Meal Planning Functions
function selectMeal(mealId) {
    const recipe = approvedRecipes.find(r => r.id === mealId);
    if (!recipe) {
        showErrorMessage('Recipe not found!');
        return;
    }
    
    // Show selected meal
    document.getElementById('selected-meal').style.display = 'block';
    document.getElementById('meal-name').textContent = recipe.name;
    
    // Show cooking instructions
    const instructionsDiv = document.getElementById('cooking-instructions');
    if (recipe.instructions) {
        instructionsDiv.innerHTML = `
            <h5>Cooking Instructions:</h5>
            <ol>
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        `;
    } else {
        instructionsDiv.innerHTML = '<p>Instructions will be added when Chris approves this recipe.</p>';
    }
    
    // Highlight selected option
    document.querySelectorAll('.meal-option').forEach(option => {
        option.style.borderColor = 'transparent';
    });
    event.target.style.borderColor = '#4ecdc4';
    
    showSuccessMessage(`Selected: ${recipe.name} - Ready to cook!`);
}

function startCooking() {
    showSuccessMessage('🔥 Happy cooking! Timer started for prep time.');
    // Could integrate with a cooking timer here
}

function updateMealSuggestions() {
    // Filter recipes based on available ingredients
    const availableRecipes = approvedRecipes.filter(recipe => {
        return recipe.approved && recipe.ingredients.every(ingredient => 
            pantryInventory.some(item => 
                item.toLowerCase().includes(ingredient.toLowerCase()) ||
                ingredient.toLowerCase().includes(item.toLowerCase())
            )
        );
    });
    
    console.log('Available recipes based on pantry:', availableRecipes.length);
}

// Shopping List Functions
function generateShoppingList() {
    showLoadingMessage('Generating smart shopping list...');
    
    setTimeout(() => {
        // Simulate shopping list generation based on recipes and inventory
        hideLoadingMessage();
        showSuccessMessage('🛒 Shopping list updated based on your meal rotation!');
    }, 1500);
}

function exportShoppingList() {
    // Create a simple text version for mobile
    const shoppingList = `
Fort Kitchen Command - Shopping List
Generated: ${new Date().toLocaleDateString()}

WALMART PICKUP:
- Ground Turkey (2 lbs) - $8.99
- Pasta (3 boxes) - $4.50
- Rice (5 lb bag) - $3.99
- Onions (3 lb bag) - $2.49

WHOLE FOODS:
- Organic Spinach (2 containers) - $7.98
- Bell Peppers (6 count) - $8.50
- Fresh Garlic - $2.99

SPROUTS:
- Black Beans (4 cans) - $4.76
- Tomato Sauce (6 cans) - $6.99

TOTAL: $51.19
    `;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shoppingList).then(() => {
        showSuccessMessage('📱 Shopping list copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shoppingList;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage('📱 Shopping list copied to clipboard!');
    });
}

// Utility Functions
function showLoadingMessage(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-message';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
        z-index: 1000;
        font-weight: bold;
    `;
    loadingDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            ${message}
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showInfoMessage(message) {
    showMessage(message, 'info');
}

function showMessage(message, type) {
    const colors = {
        success: { bg: '#4ecdc4', shadow: 'rgba(78, 205, 196, 0.4)' },
        error: { bg: '#ff6b6b', shadow: 'rgba(255, 107, 107, 0.4)' },
        info: { bg: '#ffa726', shadow: 'rgba(255, 167, 38, 0.4)' }
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type].bg};
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 5px 15px ${colors[type].shadow};
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add slide animations
const slideStyle = document.createElement('style');
slideStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideStyle);

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateInventoryDisplay();
    updateMealSuggestions();
    showSuccessMessage('🏰 Fort Kitchen Command initialized - Decision-free cooking ready!');
});

// Add PWA service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Kitchen Command SW registered');
            })
            .catch(registrationError => {
                console.log('Kitchen Command SW registration failed');
            });
    });
}