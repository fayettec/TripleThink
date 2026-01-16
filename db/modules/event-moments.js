// Event Moments Module
// CRUD operations for EVENT_MOMENTS table
// Provides granular beat tracking within events

const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  /**
   * Create a new event moment
   * @param {string} eventUuid - UUID of the parent event
   * @param {number} sequenceIndex - Order within the event (1, 2, 3...)
   * @param {string} beatDescription - Description of what happens in this beat
   * @param {number|null} timestampOffset - Optional offset from event timestamp in seconds
   * @returns {object} The created moment object
   */
  const createMoment = (eventUuid, sequenceIndex, beatDescription, timestampOffset = null) => {
    const momentUuid = uuidv4();
    const createdAt = Date.now();

    db.prepare(`
      INSERT INTO event_moments
      (moment_uuid, event_uuid, sequence_index, beat_description, timestamp_offset, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(momentUuid, eventUuid, sequenceIndex, beatDescription, timestampOffset, createdAt);

    return {
      moment_uuid: momentUuid,
      event_uuid: eventUuid,
      sequence_index: sequenceIndex,
      beat_description: beatDescription,
      timestamp_offset: timestampOffset,
      created_at: createdAt
    };
  };

  /**
   * Get all moments for a specific event, ordered by sequence_index
   * @param {string} eventUuid - UUID of the event
   * @returns {Array} Array of moment objects ordered by sequence_index
   */
  const getMomentsByEvent = (eventUuid) => {
    const rows = db.prepare(`
      SELECT moment_uuid, event_uuid, sequence_index, beat_description, timestamp_offset, created_at
      FROM event_moments
      WHERE event_uuid = ?
      ORDER BY sequence_index ASC
    `).all(eventUuid);

    return rows.map(row => ({
      moment_uuid: row.moment_uuid,
      event_uuid: row.event_uuid,
      sequence_index: row.sequence_index,
      beat_description: row.beat_description,
      timestamp_offset: row.timestamp_offset,
      created_at: row.created_at
    }));
  };

  /**
   * Get a single moment by its UUID
   * @param {string} momentUuid - UUID of the moment
   * @returns {object|null} The moment object or null if not found
   */
  const getMomentById = (momentUuid) => {
    const row = db.prepare(`
      SELECT moment_uuid, event_uuid, sequence_index, beat_description, timestamp_offset, created_at
      FROM event_moments
      WHERE moment_uuid = ?
    `).get(momentUuid);

    if (!row) return null;

    return {
      moment_uuid: row.moment_uuid,
      event_uuid: row.event_uuid,
      sequence_index: row.sequence_index,
      beat_description: row.beat_description,
      timestamp_offset: row.timestamp_offset,
      created_at: row.created_at
    };
  };

  /**
   * Update an existing moment
   * @param {string} momentUuid - UUID of the moment to update
   * @param {object} updates - Object with fields to update (sequence_index, beat_description, timestamp_offset)
   * @returns {object|null} The updated moment object or null if not found
   */
  const updateMoment = (momentUuid, updates) => {
    // Validate that moment exists
    const existing = getMomentById(momentUuid);
    if (!existing) return null;

    // Build dynamic UPDATE statement based on provided fields
    const allowedFields = ['sequence_index', 'beat_description', 'timestamp_offset'];
    const updateFields = [];
    const params = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    // If no valid fields to update, return existing
    if (updateFields.length === 0) {
      return existing;
    }

    // Add moment_uuid to params for WHERE clause
    params.push(momentUuid);

    db.prepare(`
      UPDATE event_moments
      SET ${updateFields.join(', ')}
      WHERE moment_uuid = ?
    `).run(...params);

    // Return updated moment
    return getMomentById(momentUuid);
  };

  /**
   * Delete a moment
   * @param {string} momentUuid - UUID of the moment to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deleteMoment = (momentUuid) => {
    const result = db.prepare(`
      DELETE FROM event_moments WHERE moment_uuid = ?
    `).run(momentUuid);

    return result.changes > 0;
  };

  return {
    createMoment,
    getMomentsByEvent,
    getMomentById,
    updateMoment,
    deleteMoment
  };
};
