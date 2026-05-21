const movies = [
    { id: 1, title: "Побег из Шоушенка", year: 1994, genre: "драма", avgRating: 9.2 },
    { id: 2, title: "Начало", year: 2010, genre: "фантастика", avgRating: 8.8 },
    { id: 3, title: "Безумный Макс", year: 2015, genre: "боевик", avgRating: 8.7 },
    { id: 4, title: "1+1", year: 2011, genre: "драма",  avgRating: 8.9 },
    { id: 5, title: "Джокер", year: 2019, genre: "драма",avgRating: 8.5 },
    { id: 6, title: "Мстители: Финал", year: 2019, genre: "боевик",avgRating: 8.4 }
];

let currentUser = null;
let usersDB = [];
let currentModalMovieId = null;

function loadData() {
    const storedUsers = localStorage.getItem("film_catalog_users");
    if (storedUsers) usersDB = JSON.parse(storedUsers);
    const storedUser = localStorage.getItem("film_catalog_currentUser");
    if (storedUser) currentUser = JSON.parse(storedUser);
}

function saveUsers() {
    localStorage.setItem("film_catalog_users", JSON.stringify(usersDB));
}

function saveCurrentUser() {
    if (currentUser) localStorage.setItem("film_catalog_currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("film_catalog_currentUser");
}

function updateAvgRatings() {
    for (let movie of movies) {
        let sum = 0, count = 0;
        for (let user of usersDB) {
            if (user.ratings && user.ratings[movie.id]) {
                sum += user.ratings[movie.id];
                count++;
            }
        }
        if (count > 0) movie.avgRating = Math.round((sum / count) * 10) / 10;
        else movie.avgRating = 0;
    }
}

function renderCatalog() {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const genre = document.getElementById("genreFilter")?.value || "all";
    
    let filtered = movies.filter(m => m.title.toLowerCase().includes(search));
    if (genre !== "all") filtered = filtered.filter(m => m.genre === genre);

    const container = document.getElementById("moviesContainer");
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-message">😢 Фильмы не найдены</p>';
        return;
    }
    
    container.innerHTML = filtered.map(m => `
        <article class="movie-card" data-id="${m.id}">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}">
            <div class="movie-info">
                <div class="movie-title">${m.title}</div>
                <div class="movie-year">${m.year} • ${m.genre}</div>
                <div class="movie-rating">⭐ ${m.avgRating}/10</div>
                ${currentUser && currentUser.favorites?.includes(m.id) ? '<div class="fav-badge">❤️ В избранном</div>' : ''}
            </div>
        </article>
    `).join("");
    
    document.querySelectorAll(".movie-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest(".fav-badge")) return;
            openModal(parseInt(card.dataset.id));
        });
    });
}

function renderFavorites() {
    const favIds = currentUser?.favorites || [];
    const favMovies = movies.filter(m => favIds.includes(m.id));
    const container = document.getElementById("favoritesContainer");
    const emptyDiv = document.getElementById("favoritesEmpty");
    
    if (!container) return;
    
    if (favMovies.length === 0) {
        container.innerHTML = "";
        if (emptyDiv) emptyDiv.style.display = "block";
        return;
    }
    
    if (emptyDiv) emptyDiv.style.display = "none";
    
    container.innerHTML = favMovies.map(m => `
        <article class="movie-card" data-id="${m.id}">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}">
            <div class="movie-info">
                <div class="movie-title">${m.title}</div>
                <div class="movie-year">${m.year} • ${m.genre}</div>
                <div class="movie-rating">⭐ ${m.avgRating}/10</div>
                <button class="btn-outline btn remove-fav-btn" data-id="${m.id}" style="margin-top:10px; font-size:0.8rem;">🗑 Удалить</button>
            </div>
        </article>
    `).join("");
    
    document.querySelectorAll("#favoritesContainer .movie-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-fav-btn")) return;
            openModal(parseInt(card.dataset.id));
        });
    });
    
    document.querySelectorAll(".remove-fav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const movieId = parseInt(btn.dataset.id);
            if (currentUser && currentUser.favorites) {
                currentUser.favorites = currentUser.favorites.filter(id => id !== movieId);
                const userIdx = usersDB.findIndex(u => u.username === currentUser.username);
                if (userIdx !== -1) usersDB[userIdx].favorites = currentUser.favorites;
                saveUsers();
                saveCurrentUser();
                renderFavorites();
                renderCatalog();
            }
        });
    });
}

function renderProfile() {
    const container = document.getElementById("userReviewsContainer");
    if (!container) return;
    
    if (!currentUser) {
        container.innerHTML = '<p class="empty-message">🔒 Войдите, чтобы видеть свои отзывы</p>';
        return;
    }
    
    const hasReviews = currentUser.reviews && Object.keys(currentUser.reviews).length > 0;
    
    if (!hasReviews) {
        container.innerHTML = '<p class="empty-message">📝 У вас пока нет отзывов</p>';
        return;
    }
    
    let html = "";
    for (let movieId in currentUser.reviews) {
        const movie = movies.find(m => m.id == movieId);
        if (movie) {
            const rating = currentUser.ratings?.[movieId] || "нет";
            html += `
                <div class="review-item">
                    <strong>🎬 ${movie.title}</strong> (${movie.year})
                    <br>⭐ Моя оценка: ${rating}/10
                    <br>📝 ${currentUser.reviews[movieId]}
                    <br><button class="btn-outline btn edit-review-btn" data-id="${movieId}" style="margin-top:10px;">✏️ Редактировать</button>
                </div>
            `;
        }
    }
    container.innerHTML = html;
    
    document.querySelectorAll(".edit-review-btn").forEach(btn => {
        btn.addEventListener("click", () => openModal(parseInt(btn.dataset.id)));
    });
}

function openModal(movieId) {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;
    currentModalMovieId = movieId;
    
    document.getElementById("modalTitle").innerText = movie.title;
    document.getElementById("modalYearGenre").innerText = `${movie.year} • ${movie.genre}`;
    document.getElementById("modalAvgRating").innerText = movie.avgRating;
    
    if (currentUser) {
        document.getElementById("userRating").value = currentUser.ratings?.[movieId] || "";
        document.getElementById("userReview").value = currentUser.reviews?.[movieId] || "";
    } else {
        document.getElementById("userRating").value = "";
        document.getElementById("userReview").value = "";
    }
    
    document.getElementById("reviewStatus").innerText = "";
    document.getElementById("movieModal").style.display = "flex";
}

function submitRating() {
    if (!currentUser) {
        alert("⚠️ Войдите, чтобы оценивать фильмы");
        return;
    }
    
    const rating = parseInt(document.getElementById("userRating").value);
    
    if (isNaN(rating)) {
        alert("❌ Введите число от 1 до 10");
        return;
    }
    if (rating < 1 || rating > 10) {
        alert("❌ Оценка должна быть от 1 до 10");
        return;
    }
    
    if (!currentUser.ratings) currentUser.ratings = {};
    currentUser.ratings[currentModalMovieId] = rating;
    
    const idx = usersDB.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) usersDB[idx].ratings = currentUser.ratings;
    
    updateAvgRatings();
    saveUsers();
    saveCurrentUser();
    
    document.getElementById("reviewStatus").innerText = "✅ Оценка сохранена!";
    renderCatalog();
    renderProfile();
    renderFavorites();
    
    const movie = movies.find(m => m.id === currentModalMovieId);
    if (movie) document.getElementById("modalAvgRating").innerText = movie.avgRating;
}

function submitReview() {
    if (!currentUser) {
        alert("⚠️ Войдите, чтобы писать отзывы");
        return;
    }
    
    const review = document.getElementById("userReview").value;
    
    if (!review.trim()) {
        alert("❌ Напишите текст отзыва");
        return;
    }
    
    if (!currentUser.reviews) currentUser.reviews = {};
    currentUser.reviews[currentModalMovieId] = review;
    
    const idx = usersDB.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) usersDB[idx].reviews = currentUser.reviews;
    
    saveUsers();
    saveCurrentUser();
    
    document.getElementById("reviewStatus").innerText = "✅ Отзыв сохранен!";
    renderProfile();
}

function addToFavorites() {
    if (!currentUser) {
        alert("⚠️ Войдите, чтобы добавлять в избранное");
        return;
    }
    
    if (!currentUser.favorites) currentUser.favorites = [];
    
    if (currentUser.favorites.includes(currentModalMovieId)) {
        alert("❤️ Этот фильм уже в избранном");
        return;
    }
    
    currentUser.favorites.push(currentModalMovieId);
    const idx = usersDB.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) usersDB[idx].favorites = currentUser.favorites;
    
    saveUsers();
    saveCurrentUser();
    
    alert("✅ Фильм добавлен в избранное!");
    renderCatalog();
    renderFavorites();
}

function updateAuthUI() {
    const authDiv = document.getElementById("authSection");
    if (currentUser) {
        authDiv.innerHTML = `
            <div class="user-info">
                <span class="user-name">👤 ${currentUser.username}</span>
                <button id="logoutBtn" class="btn btn-outline">🚪 Выйти</button>
            </div>
        `;
        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            currentUser = null;
            saveCurrentUser();
            updateAuthUI();
            renderCatalog();
            renderProfile();
            renderFavorites();
        });
    } else {
        authDiv.innerHTML = `
            <div class="auth-buttons">
                <button id="showLoginBtn" class="btn btn-outline">🔑 Вход</button>
                <button id="showRegisterBtn" class="btn btn-primary">📝 Регистрация</button>
            </div>
        `;
        document.getElementById("showLoginBtn")?.addEventListener("click", () => {
            const name = prompt("Введите логин:");
            if (name) {
                const user = usersDB.find(u => u.username === name);
                if (user) {
                    currentUser = JSON.parse(JSON.stringify(user));
                    saveCurrentUser();
                    updateAuthUI();
                    renderCatalog();
                    renderProfile();
                    renderFavorites();
                } else {
                    alert("❌ Пользователь не найден");
                }
            }
        });
        
        document.getElementById("showRegisterBtn")?.addEventListener("click", () => {
            const name = prompt("Придумайте логин:");
            if (name && !usersDB.find(u => u.username === name)) {
                const newUser = { username: name, favorites: [], ratings: {}, reviews: {} };
                usersDB.push(newUser);
                saveUsers();
                currentUser = newUser;
                saveCurrentUser();
                updateAuthUI();
                renderCatalog();
                renderProfile();
                renderFavorites();
            } else if (name) {
                alert("❌ Логин занят");
            }
        });
    }
}

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            document.getElementById("catalogTab").style.display = btn.dataset.tab === "catalog" ? "block" : "none";
            document.getElementById("favoritesTab").style.display = btn.dataset.tab === "favorites" ? "block" : "none";
            document.getElementById("profileTab").style.display = btn.dataset.tab === "profile" ? "block" : "none";
            
            if (btn.dataset.tab === "favorites") renderFavorites();
            if (btn.dataset.tab === "profile") renderProfile();
            if (btn.dataset.tab === "catalog") renderCatalog();
        });
    });
}

function init() {
    loadData();
    updateAvgRatings();
    updateAuthUI();
    initTabs();
    renderCatalog();
    renderFavorites();
    renderProfile();
    
    document.getElementById("searchInput")?.addEventListener("input", () => renderCatalog());
    document.getElementById("genreFilter")?.addEventListener("change", () => renderCatalog());
    
    document.getElementById("submitRatingBtn")?.addEventListener("click", submitRating);
    document.getElementById("submitReviewBtn")?.addEventListener("click", submitReview);
    document.getElementById("addToFavModalBtn")?.addEventListener("click", addToFavorites);
    document.querySelector(".close-modal")?.addEventListener("click", () => {
        document.getElementById("movieModal").style.display = "none";
    });
    
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("movieModal");
        if (e.target === modal) modal.style.display = "none";
    });
}

init();