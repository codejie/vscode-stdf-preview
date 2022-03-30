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
      case 'update_map_chart': {
        onUpdateNumberMapChart(event.data.container, event.data.chart);
        break;
      }
      case 'update_number_analyse': {
        onNumberAnalyseData(event.data.container, event.data.grid);
        break;
      }
      case 'update_analyse_map': {
        onNumberAnalyseMap(event.data.container, event.data.data);
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
}

function onUpdateNumberMapChart(container, data) {
  const l = [];
  const d = [];
  const c = [];

  data.opts.orders.forEach(order => {
    l.push(data.data.colors[order].name);
    d.push(data.data.data[order] || 0);
    c.push(data.data.colors[order].color);
  });        

  const lines = {};
  // let no = 0;
  data.data.lines.forEach(line => {
    // console.log(line.xPos);
    if (line.xPos) {
      lines[line.name] = {
        type: 'line',
        xMin: line.xPos,
        xMax: line.xPos,
        borderDash: [2, 5],
        borderWidth: 1,
        borderColor: line.color,
        label: {
          content: line.name,
          color: line.color,
          enabled: true,
          backgroundColor: 'transparent',
          position: 'start'
        }
      }
    }
  });

  const chartData = {
    data: {
      labels: l,//data.opts.labels,
      datasets: [
        {
          data: d,
          backgroundColor: c
        }
      ]
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: lines
        }
      }
    }
  };

  drawNumberChart(container, {}, chartData);  
}

function onNumberAnalyseData(container, data) {
  new gridjs.Grid({
        ...data,
        style: {
            table: {
                width: '100%'
            }
        }                
    }).render(document.getElementById(container));
}

function onNumberChange(value) {
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

  canvas.width  = 1000;//window.innerWidth;
  canvas.height = 600;//width;//window.innerHeight;

  const width = Math.min(canvas.width, canvas.height);
  const columns = Math.max(opts.maxX, opts.maxY);

  const gap = width / columns;

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
  // console.log('sort = ' + keys.toString());
  
  keys.forEach(key => {
    const item = data[key];
    ctx.fillStyle = item.color;
    ctx.fillRect(x, posY, 15, 15);
    ctx.fillText(item.name, x + 20, posY + 13);

    posY -= 25;
  }); 
}

var numberChart = null;

function drawNumberChart(id, opts, data) {
  const ctx = document.getElementById(id).getContext('2d');

  if (numberChart) {
    numberChart.data = data.data;
    numberChart.options = data.options;
    numberChart.update();
  } else {
    numberChart = new Chart(ctx, {
      type: 'bar',
      data: data.data,
      options: data.options
    });
  }
}

function onNumberAnalyseMap(id, data) {
  let row = null;
  for (let i = 0; i < data.items.length; ++ i) {
    if (i % data.columns === 0) {
      row = createNumberAnalyseMapRowContainer(id, i, data.columns);
    }
    const canvasId = createNumberAnalyseMapItemContainer(row, i, data.items[i]);
    // if (data.items[i].number === 33000007 && data.items[i].text === 'OS_TEST P4 JUDGE_V_PPMU')
      drawNumberAnalyseMap(canvasId, data.grid, data.maxX, data.maxY, data.items[i]);
  }
}

function createNumberAnalyseMapRowContainer(root, index, columns) {

  const id = `analyse-map-row-${index}`;
  const div = document.createElement('div');
  // div.setAttribute("class", "analyse-map-row");
  div.setAttribute("id", id);
  let style = "display: grid; grid-template-columns:";
  const width = 100 / columns;
  for (let i = 0; i < columns; ++ i) {
    style += ` ${width.toFixed(1)}%`;
  }
  style += ';';

  console.log('style = ' + style)

  div.setAttribute("style", style);
    
  document.getElementById(root).appendChild(div);

  return id;
}

function createNumberAnalyseMapItemContainer(root, index, data) {
  const div = document.createElement('div');
  div.setAttribute("class", "analyse-map-item");
  
  // const label = `test-map-${index}`;
  const test = document.createElement('div');
  test.setAttribute("class", "analyse-map-number");
  test.innerText = data.number;
  div.appendChild(test);

  const num = document.createElement('div');
  num.setAttribute("class", "analyse-map-text");
  num.innerText = data.text;
  div.appendChild(num);

  const id = `test-map-${index}`;
  const canvas = document.createElement('canvas');
  canvas.setAttribute("id", id);
  canvas.setAttribute("class", "analyse-map-canvas");
  div.appendChild(canvas);

  document.getElementById(root).appendChild(div);

  return id;
}

function drawNumberAnalyseMap(id, grid, maxX, maxY, data) {
  const canvas = document.getElementById(id);    
  const ctx = canvas.getContext('2d');

  canvas.width  = 200;//window.innerWidth;
  canvas.height = 200;//width;//window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const width = Math.min(canvas.width, canvas.height);
  const columns = Math.max(maxX, maxY);

  const gap = width / columns;
  // console.log('gap = ' + gap);
  // grids
  if (grid) {
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
  const colors = data.opts.colors;

  data.data.forEach(ele => {
      ctx.beginPath();
      ctx.fillStyle = colors[ele[2]];
      ctx.fillRect(ele[0] * gap + 1, ele[1] * gap + 1, gap - 1, gap - 1);
  });
  
}