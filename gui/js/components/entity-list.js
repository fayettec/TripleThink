/**
 * Entity List Component
 * Note: Logic for rendering entity lists is primarily in screens/entities.js
 * This file serves as a placeholder for entity list utilities
 */

// Entity list rendering utilities
const EntityListComponent = {
  /**
   * Create a table row for an entity
   */
  createRow(entity) {
    const row = document.createElement('tr');
    row.onclick = () => editEntity(entity.id);
    row.innerHTML = `
      <td><code>${entity.id}</code></td>
      <td>${entity.name || '-'}</td>
      <td>
        <span class="badge badge-primary">${entity.entity_type}</span>
      </td>
      <td>${entity.timestamp ? formatters.timestamp(entity.timestamp) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editEntity('${entity.id}')">
          Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteEntity('${entity.id}')">
          Delete
        </button>
      </td>
    `;
    return row;
  },
};
