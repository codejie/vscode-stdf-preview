function createRecordGridSection(parent, id, title) {
    const div = document.getElementById(parent);
    
    const label = document.createElement('div');
    label.innerHTML = title;

    const holder = document.createElement('div');
    holder.className = 'grid_holder';
    holder.id = id;

    div.appendChild(label);
    div.appendChild(holder);
}