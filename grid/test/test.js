
// new gridjs.Grid({
//     columns: ["Name", "Email", "Phone Number"],
//     data: [
//       ["John", "john@example.com", "(353) 01 222 3333"],
//       ["Mark", "mark@gmail.com", "(01) 22 888 4444"],
//       ["Eoin", "eoin@gmail.com", "0097 22 654 00033"],
//       ["Sarah", "sarahcdd@gmail.com", "+322 876 1233"],
//       ["Afshin", "afshin@mail.com", "(353) 22 87 8356"]
//     ],
//     style: {
//         table: {
//           border: '3px solid #ccc'
//         },
//         th: {
//           'background-color': 'rgba(0, 0, 0, 0.1)',
//           color: '#000',
//           'border-bottom': '3px solid #ccc',
//           'text-align': 'center'
//         },
//         td: {
//           'text-align': 'right',
//           backgroundColor: 'yellow' ,
//           height: '2px',
//           marginBottom: '1px',          
//         }
//       }   
//   }).render(document.getElementById("wrapper"));

// drawRectangles("canvas", 10, 10);

// drawGrid();
// drawChart();

// drawTable('table_wrapper', {
//   rows: 2,
//   columns: 2,
//   widths: [20,30]
// },
// [
//   [1, 2],
//   [3, 4]
// ])

// drawChart('chartjs', undefined, {
//       type: 'bar',
//       data: {
//           labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//           datasets: [{
//               label: '# of Votes',
//               data: [12, 19, 3, 5, 2, 3],
//               backgroundColor: [
//                   'rgba(255, 99, 132, 0.2)',
//                   'rgba(54, 162, 235, 0.2)',
//                   'rgba(255, 206, 86, 0.2)',
//                   'rgba(75, 192, 192, 0.2)',
//                   'rgba(153, 102, 255, 0.2)',
//                   'rgba(255, 159, 64, 0.2)'
//               ],
//               borderColor: [
//                   'rgba(255, 99, 132, 1)',
//                   'rgba(54, 162, 235, 1)',
//                   'rgba(255, 206, 86, 1)',
//                   'rgba(75, 192, 192, 1)',
//                   'rgba(153, 102, 255, 1)',
//                   'rgba(255, 159, 64, 1)'
//               ],
//               borderWidth: 1
//           }]
//       },
//       options: {
//           scales: {
//               y: {
//                   beginAtZero: true
//               }
//           }
//       }
// })


drawChart('chartjs', undefined, {
  type: 'line',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [{
      label: 'My First Dataset',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    plugins: {
      autocolors: false,
      annotation: {
        annotations: {
          // box1: {
          //   // Indicates the type of annotation
          //   type: 'box',
          //   xMin: 1,
          //   xMax: 2,
          //   yMin: 50,
          //   yMax: 70,
          //   backgroundColor: 'rgba(255, 99, 132, 0.25)'
          // },
          line1: {
            type: 'line',
            xMin: 2.2,
            xMax: 2.2,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            borderDash: [5, 15],
            label: {
              content: 'AAAAA',
              color: 'red',
              enabled: true,
              backgroundColor: 'transparent',
              position: 'start' 
            }           
          },
          line2: {
            type: 'line',
            xMin: 2,
            xMax: 2,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderDash: [5, 15],
            label: {
              content: 'AAbbbAAA',
              color: 'red',
              enabled: true,
              backgroundColor: 'transparent',
              position: 'start' 
            }
          } 
        }
      }
    }
  }
});

// drawMap('canvas', {
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

// function drawRectangles(id, maxX, maxY, data) {
//   // createCanvasSection('map-container', id);

//   const canvas = document.getElementById(id);    
//   const ctx = canvas.getContext('2d');

//   const width = Math.min(canvas.width, canvas.height);
//   const columns = Math.max(maxX, maxY);

//   // canvas.width  = window.innerWidth;
//   // canvas.height = width;//window.innerHeight;

//   const gap = width / columns;

//   // if (data.grid) {
//       ctx.strokeStyle = 'grey';
//       ctx.lineWidth = 1;

//       ctx.beginPath();
//       for (i = 0; i < (columns + 1); ++ i) {
//           // ctx.beginPath();
//           ctx.moveTo(0, i * gap);
//           ctx.lineTo(width, i * gap);
//           ctx.stroke();

//           // ctx.beginPath();
//           ctx.moveTo(i * gap, 0);
//           ctx.lineTo(i * gap, width);
//           ctx.stroke();
//       }    
//   // }
//   // ctx.beginPath();
//   // data.map.forEach(item => {
//   //     ctx.beginPath();
//   //     ctx.fillStyle = data.bin.find(bin => bin.number === item[2]).color;
//   //     ctx.fillRect(item[0] * gap + 1, item[1] * gap + 1, gap - 1, gap - 1);
//   // });

//   // drawBinLegends(ctx, width + 20, 30, 100, width, data.bin);
// }

// function drawGrid() {
//   const root = document.getElementById("wrapper");
//   for (let i = 0; i < 5; ++ i) {
//     const row = document.createElement('div');
//     row.setAttribute("class", "row1");
//     row.innerText = 'TTTT';
//     root.appendChild(row);
//   }
// }

// function drawChart() {
//   const ctx = document.getElementById('chartjs').getContext('2d');
//   const myChart = new Chart(ctx, {
//       type: 'bar',
//       data: {
//           labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//           datasets: [{
//               label: '# of Votes',
//               data: [12, 19, 3, 5, 2, 3],
//               backgroundColor: [
//                   'rgba(255, 99, 132, 0.2)',
//                   'rgba(54, 162, 235, 0.2)',
//                   'rgba(255, 206, 86, 0.2)',
//                   'rgba(75, 192, 192, 0.2)',
//                   'rgba(153, 102, 255, 0.2)',
//                   'rgba(255, 159, 64, 0.2)'
//               ],
//               borderColor: [
//                   'rgba(255, 99, 132, 1)',
//                   'rgba(54, 162, 235, 1)',
//                   'rgba(255, 206, 86, 1)',
//                   'rgba(75, 192, 192, 1)',
//                   'rgba(153, 102, 255, 1)',
//                   'rgba(255, 159, 64, 1)'
//               ],
//               borderWidth: 1
//           }]
//       },
//       options: {
//           scales: {
//               y: {
//                   beginAtZero: true
//               }
//           }
//       }
//   });  
// }

/*
** rows
** columns
** widths
*/

function drawTable(id, opts, data) {
  const root = document.getElementById(id); //div

  let style = 'display:grid; grid-template-columns: ';
  opts.widths.forEach(width => {
    style += `${width}px `;
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

/*
**
*/
function drawChart(id, opts, data) {
  const ctx = document.getElementById(id).getContext('2d');
  new Chart(ctx, data);   
}

/*
opts: {
  grid: boolean,
  maxX: number,
  maxY: number
}
data: {
  elements: [x, y, index],
  colors: [{index, color}]
}
*/
function drawMap(id, opts, data) {
  const canvas = document.getElementById(id);    
  const ctx = canvas.getContext('2d');

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
      ctx.fillStyle = data.colors.find(item => item.index === ele[2]).color;
      ctx.fillRect(ele[0] * gap + 1, ele[1] * gap + 1, gap - 1, gap - 1);
  });   

  drawMapLegends(ctx, width + 20, 30, 100, width, data.colors);
}

function drawMapLegends(ctx, x, y, width, height, data) {
  ctx.beginPath();
  ctx.font = '16px serif';

  let posY = height - 25;
  for (let i = data.length - 1; i >= 0; -- i) {
      const item = data[i];
      ctx.fillStyle = item.color;
      ctx.fillRect(x, posY, 15, 15);
      
      ctx.fillText(item.index.toString(), x + 20, posY + 13);

      posY -= 25;
  }  
}