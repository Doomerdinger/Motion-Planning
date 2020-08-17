var selectedButton;

function onClickBrushButton(button, newBrush) {
    hexagonGrid.setBrush(newBrush);

    selectedButton.style.borderWidth = "2px";
    selectedButton = button;

    button.style.borderWidth = "5px";
}
