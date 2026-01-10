/**
 * Knowledge Editor Component
 * Editor for epistemic state (who knows what, when)
 */

function showKnowledgeEditor(characterId) {
  const modal = document.getElementById('knowledge-modal');
  const body = document.getElementById('knowledge-modal-body');

  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">Character</label>
      <input type="text" class="form-input" value="${characterId}" disabled>
    </div>

    <div class="form-group">
      <label class="form-label">Knowledge Timeline</label>
      <p class="text-gray">Define what this character knows at each point in time</p>
    </div>

    <div id="knowledge-entries" style="margin: var(--space-4) 0;">
      <button type="button" class="btn btn-secondary" onclick="addKnowledgeEntry()">
        + Add Knowledge Entry
      </button>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeKnowledgeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveKnowledgeState('${characterId}')">Save Knowledge State</button>
    </div>
  `;

  modal.classList.remove('hidden');
}

function addKnowledgeEntry() {
  const entriesDiv = document.getElementById('knowledge-entries');
  const entry = document.createElement('div');
  entry.className = 'card';
  entry.style.marginTop = 'var(--space-3)';
  entry.innerHTML = `
    <div class="form-group">
      <label class="form-label">Timestamp</label>
      <input type="datetime-local" class="form-input knowledge-timestamp" />
    </div>

    <div class="form-group">
      <label class="form-label">What they know</label>
      <textarea class="form-textarea knowledge-fact" rows="3" placeholder="What fact does this character know at this time?"></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Confidence</label>
      <select class="form-select knowledge-confidence">
        <option>certain</option>
        <option>probable</option>
        <option>suspected</option>
        <option>false_belief</option>
      </select>
    </div>

    <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
      Remove
    </button>
  `;
  entriesDiv.appendChild(entry);
}

async function saveKnowledgeState(characterId) {
  const entries = document.querySelectorAll('.knowledge-timestamp');
  const knowledgeData = Array.from(entries).map((ts, idx) => ({
    timestamp: ts.value,
    fact: document.querySelectorAll('.knowledge-fact')[idx].value,
    confidence: document.querySelectorAll('.knowledge-confidence')[idx].value,
  }));

  try {
    await api.saveMetadata({
      entity_id: characterId,
      knowledge_state: knowledgeData,
    });
    toast.success('Knowledge state saved');
    closeKnowledgeModal();
  } catch (error) {
    console.error('Failed to save knowledge state:', error);
    toast.error('Failed to save knowledge state');
  }
}

function closeKnowledgeModal() {
  document.getElementById('knowledge-modal').classList.add('hidden');
}

// Modal close handlers
if (document.getElementById('knowledge-modal-close')) {
  document.getElementById('knowledge-modal-close').addEventListener('click', closeKnowledgeModal);
}
