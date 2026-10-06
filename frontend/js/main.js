const mobileInputs = document.querySelectorAll('input[type="tel"]');

mobileInputs.forEach(function(input) {
    input.addEventListener("input", function() {
        input.value = input.value.replace(/\D/g, "");
    });
});

/* Finora visual micro-interactions */
document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll(".feature-card, .money-card, .dashboard-panel, .alert-total-card, .alert-monitor-card");

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    cards.forEach(function (card) {
        card.classList.add("reveal-card");
        observer.observe(card);
    });
});
