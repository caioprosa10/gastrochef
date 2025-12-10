import { searchMeals, getMealById, getRandomPairingDrink, getCategories, filterByCategory } from './api.js';
import { getFavorites, toggleFavorite, isFavorite, getSavedTheme, saveTheme } from './storage.js';

const elements = {
    input: document.getElementById('search-input'),
    selectCategory: document.getElementById('category-select'),
    btnSearch: document.getElementById('search-btn'),
    grid: document.getElementById('recipe-grid'),
    loader: document.getElementById('loader'),
    title: document.getElementById('section-title'),
    modal: document.getElementById('recipe-modal'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.querySelector('.close-modal'),
    favCount: document.getElementById('fav-count'),
    navFav: document.getElementById('nav-favorites'),
    navHome: document.getElementById('nav-home'),
    homeLink: document.getElementById('home-link'),
    themeToggle: document.getElementById('theme-toggle'),
    // Elementos Mobile
    mobileBtn: document.querySelector('.mobile-menu-btn'),
    navList: document.getElementById('nav-list')
};

document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    updateFavCount();
    await populateCategories();
    executeSearch('Chicken', 'search'); 
});

// --- EVENTOS ---

// Mobile Menu Toggle
if (elements.mobileBtn) {
    elements.mobileBtn.addEventListener('click', () => {
        elements.navList.classList.toggle('show-mobile');
    });
}

elements.btnSearch.addEventListener('click', () => {
    const query = elements.input.value.trim();
    if (query) executeSearch(query, 'search');
});

elements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && elements.input.value.trim()) {
        executeSearch(elements.input.value.trim(), 'search');
    }
});

if (elements.selectCategory) {
    elements.selectCategory.addEventListener('change', (e) => {
        const category = e.target.value;
        if (category) {
            elements.input.value = ''; 
            executeSearch(category, 'filter');
        }
    });
}

elements.navFav.addEventListener('click', (e) => {
    e.preventDefault();
    renderFavorites();
    // Fecha menu mobile se estiver aberto
    elements.navList.classList.remove('show-mobile');
});

elements.themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    saveTheme(currentTheme);
});

if (elements.closeModal) elements.closeModal.addEventListener('click', () => toggleModal(false));
window.addEventListener('click', (e) => { if (e.target === elements.modal) toggleModal(false); });

// Reset Home Link
const goHome = (e) => {
    e.preventDefault();
    resetHome();
    elements.navList.classList.remove('show-mobile');
};
elements.navHome.addEventListener('click', goHome);
elements.homeLink.addEventListener('click', goHome);

// --- LÓGICA ---

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    // Ajusta o texto do botão de tema se necessário (opcional) ou só o ícone
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

async function populateCategories() {
    const categories = await getCategories();
    if (elements.selectCategory) {
        elements.selectCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.strCategory;
            option.textContent = cat.strCategory;
            elements.selectCategory.appendChild(option);
        });
    }
}

function resetHome() {
    elements.input.value = '';
    if (elements.selectCategory) elements.selectCategory.value = '';
    executeSearch('Chicken', 'search');
}

function getReliableSourceLink(meal) {
    if (meal.strSource && meal.strSource.trim() !== "") return meal.strSource;
    if (meal.strYoutube && meal.strYoutube.trim() !== "") return meal.strYoutube;
    return `https://www.themealdb.com/meal/${meal.idMeal}`;
}

async function executeSearch(query, type) {
    showLoader(true);
    elements.title.textContent = type === 'filter' ? `Category: ${query}` : `Results for "${query}"`;
    elements.grid.innerHTML = ''; 

    try {
        let meals;
        if (type === 'search') meals = await searchMeals(query);
        else if (type === 'filter') meals = await filterByCategory(query);
        
        if (meals) {
            meals.forEach((meal, index) => {
                setTimeout(() => createCard(meal), index * 50); 
            });
        } else {
            elements.grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 20px;">No recipes found.</p>';
        }
    } catch (error) {
        console.error(error);
        elements.grid.innerHTML = '<p style="text-align:center; color:red;">Connection error.</p>';
    } finally {
        showLoader(false);
    }
}

function renderFavorites() {
    const favorites = getFavorites();
    elements.title.textContent = 'My Favorite Recipes';
    elements.grid.innerHTML = '';
    if (favorites.length === 0) {
        elements.grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 20px;">No saved recipes yet.</p>';
        return;
    }
    favorites.forEach(meal => createCard(meal));
}

function createCard(meal) {
    const card = document.createElement('div');
    card.className = 'recipe-card fade-in'; 
    const area = meal.strArea || 'Fine Dining';
    const category = meal.strCategory || 'Recipe';

    const sourceUrl = getReliableSourceLink(meal);

    card.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
        <div class="card-body">
            <h3>${meal.strMeal}</h3>
            <div class="card-meta">
                <span class="badge"><i class="fas fa-globe"></i> ${area}</span>
                <span class="badge"><i class="fas fa-utensils"></i> ${category}</span>
            </div>
            <div class="btn-group">
                <button class="btn-view">View Details</button>
                <a href="${sourceUrl}" target="_blank" class="btn-link" title="Go to Original Recipe">
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `;

    card.querySelector('.btn-view').onclick = () => openRecipeDetails(meal.idMeal);
    elements.grid.appendChild(card);
}

// --- MODAL ---
async function openRecipeDetails(id) {
    showLoader(true);
    try {
        const meal = await getMealById(id);
        if (!meal) throw new Error("Meal not found");

        let drink = null;
        try { drink = await getRandomPairingDrink(); } catch (e) {}

        let ingredients = '';
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim()) {
                ingredients += `<li><strong>${meal[`strIngredient${i}`]}</strong>: ${meal[`strMeasure${i}`]}</li>`;
            }
        }

        const instructions = (meal.strInstructions || 'No instructions provided.').split(/\r\n|\n/).filter(l => l.trim()).map(l => `<p>${l}</p>`).join('');
        const isFav = isFavorite(meal.idMeal);
        
        const sourceUrl = getReliableSourceLink(meal);

        elements.modalBody.innerHTML = `
            <img src="${meal.strMealThumb}" class="modal-header-img">
            <div class="modal-details">
                <h2>${meal.strMeal}</h2>
                <div class="chef-citation">
                    <i class="fas fa-quote-left"></i>
                    <p>Chef's Tip: Pair with <strong>${drink ? drink.strDrink : 'Lemonade'}</strong>.</p>
                </div>
                
                <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button id="modal-fav-btn" class="btn btn-primary"><i class="${isFav ? 'fas fa-heart-broken' : 'far fa-heart'}"></i> ${isFav ? 'Remove' : 'Save'}</button>
                    
                    <a href="${sourceUrl}" target="_blank" class="btn" style="background:#333; color:fff; display:inline-flex; align-items:center; gap:5px; text-decoration:none;">
                        <i class="fas fa-external-link-alt"></i> Original Source
                    </a>
                </div>

                <h3>Ingredients</h3><ul class="ingredients-list">${ingredients}</ul>
                <h3 style="margin-top:20px;">Instructions</h3><div class="instructions">${instructions}</div>
            </div>
        `;

        document.getElementById('modal-fav-btn').onclick = () => {
            toggleFavorite(meal);
            updateFavCount();
            openRecipeDetails(id); 
        };

        toggleModal(true);
    } catch (err) {
        console.error(err);
    } finally {
        showLoader(false);
    }
}

function toggleModal(show) {
    if (show) { elements.modal.style.display = 'flex'; setTimeout(() => elements.modal.classList.add('active'), 10); }
    else { elements.modal.classList.remove('active'); setTimeout(() => elements.modal.style.display = 'none', 300); }
}

function updateFavCount() {
    elements.favCount.textContent = getFavorites().length;
}

function showLoader(visible) {
    elements.loader.className = visible ? '' : 'hidden';
}