const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
  switch (event.data.command) {
      case 'update_grid': {
          onUpdateGrid(event.data.container, event.data.grid);
          break;
      }
      case 'update_select_option': {
        onUpdateSelectOption(event.data.container, event.data.option);
      }
  }
});

function onUpdateGrid(container, data) {
  new gridjs.Grid(data).render(document.getElementById(container));
}

function onUpdateSelectOption(container, data) {
  const select = document.getElementById(container);
  
  const opt = document.createElement('option');
  opt.value = data.index;
  opt.innerHTML = data.text;

  select.appendChild(opt);
  
}