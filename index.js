// menu responsive


let overlay = document.querySelector ('#overlay');
let menuHamburger = document.querySelector('.menu-hamburger');
let menuResponsive = document.querySelector('.menu-responsive');
let menuClose = document.querySelector('.btn-close-responsive');

menuHamburger.addEventListener('click', () => {
    menuResponsive.classList.add('active');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

menuClose.addEventListener('click', () => {
    menuResponsive.classList.remove('active');
    overlay.style.display = "none";
    document.body.style.overflow = 'auto';
});

// acordeon


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
            content.style.padding = '{padding}px';
        }
    });
});

// card payment

const valueColor = document.querySelector('#value-color');
const colorButtons = document.querySelectorAll('.container-color');

colorButtons.forEach(button => {
    button.addEventListener('click', e => {
        colorButtons.forEach(btn => btn.classList.remove
        ('selected'));
        e.currentTarget.classList.add('selected');
        const color = e.target.dataset.color;
        valueColor.innerText = color;
    });
});

const selectedSizes = [];
const valueSizeElement = document.querySelector('#value-size');
const sizeButtons = document.querySelectorAll('.btn-size');

sizeButtons.forEach(button => {
    button.addEventListener('click', e => {
        const size = e.currentTarget.dataset.size;
        const index = selectedSizes.indexOf(size);

        if (index === -1) {
            selectedSizes.push(size);
            e.currentTarget.classList.add('selected');
        } else {
            selectedSizes.splice(index, 1);
            e.currentTarget.classList.remove('selected');
        }

        updateValueSize();
    });
});

function updateValueSize() {
    if (selectedSizes.length > 0) {
        valueSizeElement.textContent = selectedSizes.join(', ');
    } else {
        valueSizeElement.textContent = 'sin complementos';
    }
}

const btnIncrement = document.querySelector('#btn-increment');
const btnDecrement = document.querySelector('#btn-decrement');
const countProduct = document.querySelector('#count-product');
const totalProductsCart = document.querySelector('.count-products-cart');
const btnAddToCart = document.querySelector('.btn-add-to-cart');
const priceProduct = document.querySelector('.price');
const quantityProduct = document.querySelector
('#quantity-product');
const totalPrice = document.querySelector('.price-total');
const totalValue = document
    .querySelector('.value')
    .querySelector('p');

const updateButtonState = () => {
    if (parseInt(countProduct.textContent) <= 1) {
        btnDecrement.disabled = true;
    } else {
        btnDecrement.disabled = false;
    }
};

const updateValueQuantity = () => {
    let quantity = parseInt(countProduct.textContent);
    let price = parseInt(priceProduct.textContent.replace('$', '').trim());
    let total = `$${(quantity * price).toFixed(2)}`;
    quantityProduct.textContent = quantity;
    totalValue.textContent = total;
    totalPrice.textContent = total;
}

    // event listener para incrementar
btnIncrement.addEventListener('click', () => {
    countProduct.textContent = parseInt(countProduct.
        textContent) + 1;
    updateButtonState();
    updateValueQuantity ();
});

btnDecrement.addEventListener('click', () => {
    countProduct.textContent = parseInt(countProduct.
        textContent) - 1;
    updateButtonState();
    updateValueQuantity ();
});

btnAddToCart.addEventListener('click',() =>{
    totalProductsCart.textContent =
        parseInt(totalProductsCart.textContent) +
        parseInt(countProduct.textContent);
    countProduct.textContent = 1;
    updateButtonState()
});

// actualiza el estado del botton al cargar la pagina
updateButtonState()

