// java de home

document.addEventListener('DOMContentLoaded', function() {
    // Obtener la referencia a las imágenes y al body
    const logos = document.querySelectorAll('.logo-img');
    const body = document.body;

    // Asignar eventos a cada logo para cambiar el fondo al pasar el mouse
    logos.forEach(logo => {
        logo.addEventListener('mouseover', () => {
            // Obtener la clase del logo
            const logoClass = logo.classList[1]; // La segunda clase es la específica del logo
            // Asignar imagen de fondo basada en la clase del logo
            switch (logoClass) {
                case 'space':
                    body.style.backgroundImage = 'url("img/fondo space.gif")';
                    break;
                case 'american':
                    body.style.backgroundImage = 'url("img/fondo american.jpg")';
                    break;
                case 'paparrazis':
                    body.style.backgroundImage = 'url("img/fondo paparrazis.jpg")';
                    break;
                case 'ccs':
                    body.style.backgroundImage = 'url("img/fondo ccs.png")';
                    break;
                default:
                    body.style.backgroundImage = 'none'; // Restaurar a ningún fondo si no se encuentra ninguna clase específica
            }
        });

        logo.addEventListener('mouseout', () => {
            body.style.backgroundImage = 'none'; // Restaurar el fondo a ninguno cuando el mouse sale de la imagen
        });
    });


// Función para cambiar el fondo y el color del texto al pasar el mouse sobre la imagen
function cambiarFondoYColor(color, fondo, link) {
    body.style.backgroundColor = color;
    body.style.backgroundImage = `url(${fondo})`;

    // Cambiar el color del texto del <a> al pasar el mouse sobre la imagen
    link.style.color = 'white';
}

});

// Obtener elementos HTML
const closePopupButton = document.getElementById("closePopup");
const popup = document.getElementById("popup");

// Mostrar la ventana emergente automáticamente al cargar la página
window.addEventListener("load", function() {
    popup.style.display = "block";
});

// Cerrar la ventana emergente cuando se hace clic en la "X"
closePopupButton.addEventListener("click", function() {
    popup.style.display = "none";
});

// Cerrar la ventana emergente si se hace clic fuera de ella
window.addEventListener("click", function(event) {
    if (event.target == popup) {
        popup.style.display = "none";
    }
});
