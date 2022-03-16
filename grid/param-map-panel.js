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
  // new gridjs.Grid(data).render(document.getElementById(container));
  drawTable(container, data.opts, data.data);
}

function onUpdateSelectOption(container, data) {
  const select = document.getElementById(container);
  
  const opt = document.createElement('option');
  opt.value = data.index;
  opt.innerHTML = data.text;

  select.appendChild(opt);
  
}

function drawTable(id, opts, data) {
  const root = document.getElementById(id); //div

  let style = 'display:grid; grid-template-columns: ';
  opts.widths.forEach(width => {
    style += `${width} `;
  });
  root.style.cssText += style;

  for (let r = 0; r < opts.rows; ++ r) {
    for (let c = 0; c < opts.columns; ++ c) {
      const cell = document.createElement('div');
      cell.innerHTML = data[r][c];
      if (r == 0) {
        if (c != 0) {
          cell.setAttribute('class', 'table_first_row');
        } else {
          cell.setAttribute('class', 'table_first_row_col');
        }
      } else if (c == 0) {
        cell.setAttribute('class', 'table_first_col');
      } else {
        cell.setAttribute('class', 'table_others');
      }
      root.appendChild(cell);
    }
  }
}