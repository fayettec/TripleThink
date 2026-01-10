/**
 * Metadata Modal Component
 * Editor for entity metadata
 */

function showMetadataModal(entityId) {
  const modal = document.getElementById('metadata-modal');
  const body = document.getElementById('metadata-modal-body');

  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">Author Notes</label>
      <textarea class="form-textarea" id="metadata-notes" rows="5" placeholder="Add author notes and guidance..."></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">AI Context</label>
      <textarea class="form-textarea" id="metadata-context" rows="5" placeholder="AI-specific guidance for queries..."></textarea>
    </div>

    <div class="form-checkbox">
      <input type="checkbox" id="metadata-mandatory" />
      <label class="form-label">Read by default (mandatory metadata)</label>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeMetadataModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveMetadata('${entityId}')">Save Metadata</button>
    </div>
  `;

  modal.classList.remove('hidden');
}

async function saveMetadata(entityId) {
  const notes = document.getElementById('metadata-notes').value;
  const context = document.getElementById('metadata-context').value;
  const mandatory = document.getElementById('metadata-mandatory').checked;

  try {
    await api.saveMetadata({
      entity_id: entityId,
      author_notes: notes,
      ai_context: context,
      read_metadata_mandatory: mandatory,
    });
    toast.success('Metadata saved');
    closeMetadataModal();
  } catch (error) {
    console.error('Failed to save metadata:', error);
    toast.error('Failed to save metadata');
  }
}

function closeMetadataModal() {
  document.getElementById('metadata-modal').classList.add('hidden');
}

// Modal close handlers
if (document.getElementById('metadata-modal-close')) {
  document.getElementById('metadata-modal-close').addEventListener('click', closeMetadataModal);
}
