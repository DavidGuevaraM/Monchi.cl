
document.addEventListener('DOMContentLoaded', function() {
    // Tu código JavaScript aquí


const acordeonButton = document.querySelectorAll('.acordeon-button');

acordeonButton.forEach( button => {
    button.addEventListener('click', function () {
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-plus')) {
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
        } else {
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
        }
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        console.log(content.textContent);

        if (content.style.height) {
            content.style.height = null;
            content.style.padding = '5px 25px';
        } else {
            const padding = 20;
            content.style.height = 
                content.scrollHeight + padding * 2 + 'px';
            content.style.padding = `{padding}px`;

        }
    });
});

});