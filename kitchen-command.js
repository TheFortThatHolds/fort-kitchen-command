// Fort Kitchen Command - Decision-Free Meal Management System
// JavaScript functionality for pantry tracking, recipe management, and shopping lists

// Pantry inventory - stored in localStorage
let pantryInventory = [];

// Recipes stored in localStorage for persistence
let approvedRecipes = [];

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
            // Simulate detected items - in a real app this would use AI
            const detectedItems = [
                'Item 1', 'Item 2', 'Item 3'
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
    
    if (pantryInventory.length === 0) {
        inventoryContainer.innerHTML = '<p style="opacity: 0.7; text-align: center; grid-column: 1/-1;">No items in pantry yet. Upload photos or add items manually!</p>';
    } else {
        pantryInventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.textContent = item;
            itemDiv.onclick = () => removeInventoryItem(item);
            itemDiv.title = 'Click to remove';
            inventoryContainer.appendChild(itemDiv);
        });
    }
    savePantryToStorage();
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
    
    const instructions = [];
    let step = prompt('Enter cooking instruction (or leave empty to finish):');
    while (step && step.trim()) {
        instructions.push(step.trim());
        step = prompt('Enter next instruction (or leave empty to finish):');
    }
    
    const newRecipe = {
        id: recipeName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: recipeName,
        ingredients: ingredients.split(',').map(i => i.trim()),
        prepTime: prepTime,
        approved: true,  // Auto-approve since no Chris approval needed
        notes: notes,
        instructions: instructions,
        sourceURL: null,
        sourceName: null
    };
    
    approvedRecipes.push(newRecipe);
    updateRecipeDisplay();
    updateMealSuggestions();
    showSuccessMessage(`Added recipe "${recipeName}"!`);
    
    // Update meal suggestions
    setTimeout(() => {
        showSection('recipes');
    }, 100);
}

function toggleRecipeApproval(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (recipe) {
        recipe.approved = !recipe.approved;
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage(recipe.approved ? '✅ Recipe approved!' : '⏸️ Recipe set to pending');
    }
}

function updateRecipeDisplay() {
    const container = document.getElementById('recipe-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (approvedRecipes.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7; text-align: center;">No recipes yet. Click "+ Add New Recipe" or "Import from URL" to get started!</p>';
    } else {
        approvedRecipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.onclick = () => showRecipeDetails(recipe.id);
        
        const statusClass = recipe.approved ? 'approved' : 'pending';
        const statusText = recipe.approved ? '✅ Approved' : '⏸️ Pending';
        
        recipeCard.innerHTML = `
            <h3>${recipe.name}</h3>
            <div class="recipe-status ${statusClass}">${statusText}</div>
            ${recipe.sourceURL ? `<p style="font-size: 0.9em; opacity: 0.8;">📌 From: <a href="${recipe.sourceURL}" target="_blank" style="color: #4ecdc4;">${recipe.sourceName || new URL(recipe.sourceURL).hostname}</a></p>` : ''}
            <p><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
            <p><strong>Prep Time:</strong> ${recipe.prepTime} minutes</p>
            ${recipe.notes ? `<p><strong>Notes:</strong> ${recipe.notes}</p>` : ''}
        `;
        
            container.appendChild(recipeCard);
        });
    }
    
    saveRecipesToStorage();
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
        instructionsDiv.innerHTML = '<p>Instructions coming soon.</p>';
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
- Tempeh (3 packages) - $11.99
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

TOTAL: $54.19
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

// Add function to import recipe from URL
function importRecipeFromURL() {
    const url = prompt('Enter the recipe URL:');
    if (!url) return;
    
    showLoadingMessage('Fetching recipe from website...');
    
    // Simulate fetching and parsing - in production this would use a real parser
    // Many recipe sites use structured data (JSON-LD) that can be parsed
    setTimeout(() => {
        hideLoadingMessage();
        
        // For demo, extract domain name for attribution
        let sourceName;
        try {
            const urlObj = new URL(url);
            sourceName = urlObj.hostname.replace('www.', '');
        } catch (e) {
            sourceName = 'External Recipe';
        }
        
        // Prompt for basic recipe info since we can't actually fetch
        const recipeName = prompt('Recipe name:', 'Imported Recipe');
        if (!recipeName) return;
        
        const ingredients = prompt('Main ingredients (comma-separated):');
        if (!ingredients) return;
        
        const prepTime = parseInt(prompt('Prep time (minutes):')) || 30;
        
        const newRecipe = {
            id: recipeName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: recipeName,
            ingredients: ingredients.split(',').map(i => i.trim()),
            prepTime: prepTime,
            approved: true,
            notes: `Imported from ${sourceName}`,
            sourceURL: url,
            sourceName: sourceName,
            instructions: ['Visit the original recipe for detailed instructions']
        };
        
        approvedRecipes.push(newRecipe);
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage(`Recipe imported from ${sourceName}!`);
    }, 1500);
}

// Add function to show recipe details
function showRecipeDetails(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    let detailsHTML = `
        <h3>${recipe.name}</h3>
        ${recipe.sourceURL ? `<p>📌 <a href="${recipe.sourceURL}" target="_blank" style="color: #4ecdc4;">View original recipe at ${recipe.sourceName}</a></p>` : ''}
        <p><strong>Prep Time:</strong> ${recipe.prepTime} minutes</p>
        <p><strong>Ingredients:</strong></p>
        <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
    `;
    
    if (recipe.instructions && recipe.instructions.length > 0) {
        detailsHTML += `
            <p><strong>Instructions:</strong></p>
            <ol>${recipe.instructions.map(i => `<li>${i}</li>`).join('')}</ol>
        `;
    }
    
    if (recipe.notes) {
        detailsHTML += `<p><strong>Notes:</strong> ${recipe.notes}</p>`;
    }
    
    detailsHTML += `
        <br>
        <button class="btn" onclick="editRecipe('${recipeId}')">Edit Recipe</button>
        <button class="btn btn-secondary" onclick="deleteRecipe('${recipeId}')">Delete Recipe</button>
    `;
    
    // Create modal or expand card
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #4ecdc4;
        border-radius: 20px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 2000;
        color: white;
    `;
    modal.innerHTML = detailsHTML;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1999;
    `;
    backdrop.onclick = () => {
        modal.remove();
        backdrop.remove();
    };
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
}

// Add function to edit recipe
function editRecipe(recipeId) {
    const recipe = approvedRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const newName = prompt('Recipe name:', recipe.name);
    if (newName) recipe.name = newName;
    
    const newIngredients = prompt('Ingredients (comma-separated):', recipe.ingredients.join(', '));
    if (newIngredients) recipe.ingredients = newIngredients.split(',').map(i => i.trim());
    
    const newPrepTime = prompt('Prep time (minutes):', recipe.prepTime);
    if (newPrepTime) recipe.prepTime = parseInt(newPrepTime);
    
    const newNotes = prompt('Notes:', recipe.notes || '');
    recipe.notes = newNotes;
    
    updateRecipeDisplay();
    updateMealSuggestions();
    showSuccessMessage('Recipe updated!');
    
    // Close modal
    document.querySelector('div[style*="z-index: 2000"]')?.remove();
    document.querySelector('div[style*="z-index: 1999"]')?.remove();
}

// Add function to delete recipe
function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        approvedRecipes = approvedRecipes.filter(r => r.id !== recipeId);
        updateRecipeDisplay();
        updateMealSuggestions();
        showSuccessMessage('Recipe deleted!');
        
        // Close modal
        document.querySelector('div[style*="z-index: 2000"]')?.remove();
        document.querySelector('div[style*="z-index: 1999"]')?.remove();
    }
}

// Add functions to save/load recipes from localStorage
function saveRecipesToStorage() {
    localStorage.setItem('fortKitchenRecipes', JSON.stringify(approvedRecipes));
}

function loadRecipesFromStorage() {
    const stored = localStorage.getItem('fortKitchenRecipes');
    if (stored) {
        try {
            approvedRecipes = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load recipes from storage');
            approvedRecipes = [];
        }
    } else {
        approvedRecipes = [];
    }
}

function savePantryToStorage() {
    localStorage.setItem('fortKitchenPantry', JSON.stringify(pantryInventory));
}

function loadPantryFromStorage() {
    const stored = localStorage.getItem('fortKitchenPantry');
    if (stored) {
        try {
            pantryInventory = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load pantry from storage');
            pantryInventory = [];
        }
    } else {
        pantryInventory = [];
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadPantryFromStorage();
    loadRecipesFromStorage();
    updateInventoryDisplay();
    updateRecipeDisplay();
    updateMealSuggestions();
    showSuccessMessage('🏰 Fort Kitchen Command ready - Add your favorite recipes!');
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