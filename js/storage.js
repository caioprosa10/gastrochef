const FAV_KEY = 'gastrochef_favorites';
const THEME_KEY = 'gastrochef_theme';

// --- FAVORITES LOGIC ---
export function getFavorites() {
    const data = localStorage.getItem(FAV_KEY);
    return data ? JSON.parse(data) : [];
}

export function isFavorite(id) {
    const favorites = getFavorites();
    return favorites.some(meal => meal.idMeal === id);
}

export function toggleFavorite(meal) {
    const favorites = getFavorites();
    const index = favorites.findIndex(item => item.idMeal === meal.idMeal);
    
    let added = false;

    if (index === -1) {
        // Objeto minificado salvo no LocalStorage (Requisito: Arrays of JSON data)
        const mealMinified = {
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            strArea: meal.strArea || 'Unknown',
            strCategory: meal.strCategory || 'General'
        };
        favorites.push(mealMinified);
        added = true;
    } else {
        favorites.splice(index, 1);
        added = false;
    }

    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    return added;
}

// --- THEME LOGIC (Novo Requisito: LocalStorage Used Effectively) ---
export function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}