
new gridjs.Grid({
    columns: ["Name", "Email", "Phone Number"],
    data: [
      ["John", "john@example.com", "(353) 01 222 3333"],
      ["Mark", "mark@gmail.com", "(01) 22 888 4444"],
      ["Eoin", "eoin@gmail.com", "0097 22 654 00033"],
      ["Sarah", "sarahcdd@gmail.com", "+322 876 1233"],
      ["Afshin", "afshin@mail.com", "(353) 22 87 8356"]
    ],
    style: {
        table: {
          border: '3px solid #ccc'
        },
        th: {
          'background-color': 'rgba(0, 0, 0, 0.1)',
          color: '#000',
          'border-
          bottom': '3px solid #ccc',
          'text-align': 'center'
        },
        td: {
          'text-align': 'right',
          backgroundColor: 'yellow' ,
          height: '2px',
          marginBottom: '1px',          
        }
      }   
  }).render(document.getElementById("wrapper"));

drawRectangles("canvas", 10, 10);

  function drawRectangles(id, maxX, maxY, data) {
    // createCanvasSection('map-container', id);

    const canvas = document.getElementById(id);    
    const ctx = canvas.getContext('2d');

    const width = Math.min(canvas.width, canvas.height);
    const columns = Math.max(maxX, maxY);

    // canvas.width  = window.innerWidth;
    // canvas.height = width;//window.innerHeight;

    const gap = width / columns;

    // if (data.grid) {
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
    // }
    // ctx.beginPath();
    // data.map.forEach(item => {
    //     ctx.beginPath();
    //     ctx.fillStyle = data.bin.find(bin => bin.number === item[2]).color;
    //     ctx.fillRect(item[0] * gap + 1, item[1] * gap + 1, gap - 1, gap - 1);
    // });

    // drawBinLegends(ctx, width + 20, 30, 100, width, data.bin);
}