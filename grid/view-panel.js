
const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
    switch (event.data.command) {
        // case 'cmd_data': {
        //     // onCommandData(event.data.component, event.data.data);
        //     break;
        // }
        case 'cmd_config': {
            onCommandConfig(event.data.component, event.data.data);
            break;
        }
        case 'cmd_component': {
            console.log('get event - ' + event.data.name);
            onCommandComponent(event.data.id, event.data.title, event.data.desc);
            break;
        }
        case 'cmd_draw_rect': {
            onCommandDrawRect(event.data);
            break;
        }
    }
});

window.onresize = resize;

function resize() {
    console.log('resize =============');
    drawRectangles("canvas");
}

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

    const width = Math.min( window.innerWidth, window.innerHeight * 0.95);
    const columns = Math.max(maxX, maxY);

    canvas.width  = width;//window.innerWidth * 0.9;
    canvas.height = width;//window.innerHeight * 0.9;

    const gap = width / columns;

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



    ctx.fillStyle = '#33691E';
    // ctx.strokeStyle = '#33691E';
    // ctx.lineWidth = '1px';
    ctx.beginPath();
    for (i = 0; i < columns; ++ i) {
        ctx.fillRect((i * gap) + 1, (i * gap) + 1, gap - 1 , gap - 1);
        // ctx.strokeRect(i * side, i * side, side, side);
    }
}


// function drawRectangles(id, maxX, maxY, data) {
//     createCanvasSection('map-container', id);

//     const canvas = document.getElementById(id);
//     console.log('canvas - ' + canvas.width);
//     console.log('canvas - ' + canvas.height);
    
//     const ctx = canvas.getContext('2d');

//     const width = Math.min( window.innerWidth, window.innerHeight * 0.95);

//     canvas.width  = width;//window.innerWidth * 0.9;
//     canvas.height = width;//window.innerHeight * 0.9;
//     console.log('canvas end - ' + canvas.width);
//     console.log('canvas end - ' + canvas.height);

//     console.log('min width end - ' + width);
//     const gap = width / 100;

//     ctx.strokeStyle = 'grey';
//     ctx.lineWidth = .1;

//     ctx.beginPath();
//     for (i = 0; i < 101; ++ i) {
//         // ctx.beginPath();
//         ctx.moveTo(0, i * gap);
//         ctx.lineTo(width, i * gap);
//         ctx.stroke();

//         // ctx.beginPath();
//         ctx.moveTo(i * gap, 0);
//         ctx.lineTo(i * gap, width);
//         ctx.stroke();
//     }    

//     ctx.fillStyle = '#33691E';
//     ctx.strokeStyle = 'blue';
//     // ctx.lineWidth = '1px';
//     ctx.beginPath();
//     for (i = 0; i < 100; ++ i) {
//         ctx.fillRect((i * gap) + 1, (i * gap) + 1, gap - 1 , gap - 1);
//         // ctx.strokeRect(i * side, i * side, side, side);
//     }
// }