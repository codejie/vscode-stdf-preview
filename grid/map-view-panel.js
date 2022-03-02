const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
    switch (event.data.command) {
        case 'cmd_config': {
            onCommandConfig(event.data.component, event.data.data);
            break;
        }
        case 'cmd_component': {
            onCommandComponent(event.data.id, event.data.title, event.data.desc);
            break;
        }
        case 'cmd_draw_rect': {
            onCommandDrawRect(event.data);
            break;
        }
    }
});

// window.onresize = resize;

// function resize() {
//     // drawRectangles("canvas");
// }

function onCommandConfig(component, data) {
    const grid = new gridjs.Grid({
        ...data,
        style: {
            table: {
                width: '100%'
            }
        }                
    }).render(document.getElementById(component));
}

function onCommandComponent(id, title) {
    createRecordGridSection('container', id, title);
}

function onCommandDrawRect(payload) {
    drawRectangles(payload.id, payload.maxX, payload.maxY, payload.data);
}

function createRecordGridSection(parent, id, title) {
    const div = document.getElementById(parent);
    
    const label = document.createElement('div');
    label.setAttribute("width", "100%");
    label.innerHTML = title;

    const holder = document.createElement('div');
    holder.className = 'grid_holder';
    holder.id = id;

    div.appendChild(label);
    div.appendChild(holder);
}

function createCanvasSection(parent, id) {
    const div = document.getElementById(parent);
    const canvas = document.createElement('canvas');
    canvas.id = id;
    div.appendChild(canvas);
}

function drawRectangles(id, maxX, maxY, data) {
    // createCanvasSection('map-container', id);

    const canvas = document.getElementById(id);    
    const ctx = canvas.getContext('2d');

    const width = Math.min(window.innerWidth, window.innerHeight * 0.96);
    const columns = Math.max(maxX, maxY);

    canvas.width  = window.innerWidth;
    canvas.height = width;//window.innerHeight;

    const gap = width / columns;

    if (data.grid) {
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
    // ctx.beginPath();
    data.map.forEach(item => {
        ctx.beginPath();
        ctx.fillStyle = data.bin.find(bin => bin.number === item[2]).color;
        ctx.fillRect(item[0] * gap + 1, item[1] * gap + 1, gap - 1, gap - 1);
    });

    drawBinLegends(ctx, width + 10, 30, 100, width, data.bin);
}

function drawBinLegends(ctx, x, y, width, height, data) {
    ctx.beginPath();
    ctx.font = '16px serif';

    let posY = height - 25;
    for (let i = data.length - 1; i >= 0; -- i) {
        const item = data[i];
        ctx.fillStyle = item.color;
        ctx.fillRect(x, posY, 15, 15);
        
        ctx.fillText(item.number.toString(), x + 20, posY + 13);

        posY -= 25;
    }
}

// function drawBinLegends(ctx, x, y, width, height, data) {
//     ctx.beginPath();
//     ctx.font = '16px serif';
//     let posY = y;
//     data.forEach(item => {
//         ctx.fillStyle = item.color;
//         ctx.fillRect(x, y, 15, 15);
        
//         ctx.fillText(item.number.toString(), x + 20, y + 13);

//         y += 25;
//     });
// }