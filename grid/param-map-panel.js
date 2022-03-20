const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
  switch (event.data.command) {
      case 'update_grid': {
          onUpdateGrid(event.data.container, event.data.grid);
          break;
      }
      case 'update_select_option': {
        onUpdateSelectOption(event.data.container, event.data.option);
        break;
      }
      case 'update_map': {
        onUpdateNumberMap(event.data.container, event.data.map);
        break;
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

function onUpdateNumberMap(container, data) {
  drawMap(container, data.opts, data.data);

  // drawMap(container, {
  //   grid: true,
  //   maxX: 4,
  //   maxY: 4
  // }, {
  //   elements: [
  //     [0, 1, 1],
  //     [0, 2, 1],
  //     [1, 1, 2],
  //     [2, 2, 3]
  //   ],
  //   colors: [
  //     {
  //       index: 1,
  //       color: 555
  //     },
  //     {
  //       index: 2,
  //       color: 999
  //     },
  //     {
  //       index: 3,
  //       color: 000
  //     }        
  //   ]
  // })  
}

function onNumberChange(value) {
  console.log(value);

  vscode.postMessage({
    command: 'number_changed',
    data: {
      value
    }
  });
}

function drawTable(id, opts, data) {
  const root = document.getElementById(id); //div
  root.innerHTML = '';

  let style = 'display:grid; grid-template-columns: ';
  opts.widths.forEach(width => {
    style += `${width} `;
  });
  root.style.cssText += style;

  for (let r = 0; r < opts.rows; ++ r) {
    for (let c = 0; c < opts.columns; ++ c) {
      const cell = document.createElement('div');
      cell.innerHTML = data[r][c];
      cell.setAttribute('class', 'table_item table_cell');
      if (r === 0) {
        if (c !== 0) {
          cell.setAttribute('class', 'table_first_row table_cell');
        } else {
          cell.setAttribute('class', 'table_first_row_col table_cell');
        }
      } else if (c === 0) {
        cell.setAttribute('class', 'table_first_col table_cell');
      } else {
        cell.setAttribute('class', 'table_others table_cell');
      }
      root.appendChild(cell);
    }
  }
}


/*
opts: {
  grid: boolean,
  maxX: number,
  maxY: number,
}
data: {
  elements: [x, y, index],
  colors: [{index, color}]
}
*/
function drawMap(id, opts, data) {
  const canvas = document.getElementById(id);    
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // const width = Math.min(window.innerWidth, window.innerHeight * 0.96);
  // const columns = Math.max(opts.maxX, opts.maxY);

  // canvas.width  = 800;//window.innerWidth;
  // canvas.height = 600;//width;//window.innerHeight;

  const width = Math.min(canvas.width, canvas.height);
  const columns = Math.max(opts.maxX, opts.maxY);

  const gap = width / columns;

  console.log('width = ' + width);
  console.log('canvas width = ' + canvas.width);
  console.log('canvas height = ' + canvas.height);
  console.log('columns = ' + columns);
  console.log('gap = ' + gap);

  // grids
  if (opts.grid) {
      ctx.strokeStyle = 'grey';
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (i = 0; i < (columns + 1); ++ i) {
          // ctx.beginPath();
          ctx.moveTo(0, i * gap);
          ctx.lineTo(width, i * gap);
          ctx.stroke();

          // ctx.beginPath();
          ctx.moveTo(i * gap, 0);
          ctx.lineTo(i * gap, width);
          ctx.stroke();
      }    
  }
  // rectangles
  // ctx.beginPath();
  data.elements.forEach(ele => {
      ctx.beginPath();
      // if (!data.colors[ele[2]]) {
      //   console.log('================' + ele[2]);
      // }
      ctx.fillStyle = data.colors[ele[2]].color;
      ctx.fillRect(ele[0] * gap + 1, ele[1] * gap + 1, gap - 1, gap - 1);
  });   

  drawMapLegends(ctx, width + 10, 30, 100, width, data.colors);
}

function drawMapLegends(ctx, x, y, width, height, data) {
  ctx.beginPath();
  ctx.font = '16px serif';

  let posY = height - 25;
  const keys = Object.keys(data);
  keys.sort();
  console.log('sort = ' + keys.toString());
  
  keys.forEach(key => {
    const item = data[key];
    ctx.fillStyle = item.color;
    ctx.fillRect(x, posY, 15, 15);
    ctx.fillText(item.name, x + 20, posY + 13);

    posY -= 25;
  }); 
}