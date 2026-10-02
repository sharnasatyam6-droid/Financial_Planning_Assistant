const mobileInputs = document.querySelectorAll('input[type="tel"]');

mobileInputs.forEach(function(input) {
    input.addEventListener("input", function() {
        input.value = input.value.replace(/\D/g, "");
    });
});