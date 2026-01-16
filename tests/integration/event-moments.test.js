const request = require('supertest');
const Database = require('better-sqlite3');
const app = require('../../api/server');

describe('EVENT_MOMENTS API Integration Tests', () => {
  let db;
  const testEventUuid = 'test-event-integration-001';

  beforeAll(() => {
    // Initialize test database
    db = new Database('db/triplethink.db');
    // Clean up any existing test data
    db.prepare('DELETE FROM event_moments WHERE event_uuid = ?').run(testEventUuid);
  });

  afterAll(() => {
    // Clean up test data
    db.prepare('DELETE FROM event_moments WHERE event_uuid = ?').run(testEventUuid);
    db.close();
  });

  describe('POST /api/moments', () => {
    test('creates moment with all fields', async () => {
      const response = await request(app)
        .post('/api/moments')
        .send({
          event_uuid: testEventUuid,
          sequence_index: 1,
          beat_description: 'Character enters scene',
          timestamp_offset: 0
        })
        .expect(201);

      expect(response.body).toHaveProperty('moment_uuid');
      expect(response.body.event_uuid).toBe(testEventUuid);
      expect(response.body.sequence_index).toBe(1);
      expect(response.body.beat_description).toBe('Character enters scene');
    });

    test('creates moment without optional timestamp_offset', async () => {
      const response = await request(app)
        .post('/api/moments')
        .send({
          event_uuid: testEventUuid,
          sequence_index: 2,
          beat_description: 'Character speaks'
        })
        .expect(201);

      expect(response.body).toHaveProperty('moment_uuid');
      expect(response.body.timestamp_offset).toBeNull();
    });

    test('rejects missing required fields', async () => {
      await request(app)
        .post('/api/moments')
        .send({
          event_uuid: testEventUuid
          // Missing sequence_index and beat_description
        })
        .expect(400);
    });
  });

  describe('GET /api/moments/:eventUuid', () => {
    test('returns moments in sequence_index order', async () => {
      // Create moments out of order
      await request(app).post('/api/moments').send({
        event_uuid: testEventUuid,
        sequence_index: 5,
        beat_description: 'Fifth beat'
      });

      await request(app).post('/api/moments').send({
        event_uuid: testEventUuid,
        sequence_index: 3,
        beat_description: 'Third beat'
      });

      await request(app).post('/api/moments').send({
        event_uuid: testEventUuid,
        sequence_index: 4,
        beat_description: 'Fourth beat'
      });

      const response = await request(app)
        .get(`/api/moments/${testEventUuid}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(5);

      // Check the moments are ordered by sequence_index
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i].sequence_index).toBeGreaterThanOrEqual(
          response.body[i - 1].sequence_index
        );
      }
    });

    test('returns empty array for non-existent event', async () => {
      const response = await request(app)
        .get('/api/moments/non-existent-event')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PUT /api/moments/:momentUuid', () => {
    test('updates beat_description', async () => {
      // Create moment
      const createResponse = await request(app)
        .post('/api/moments')
        .send({
          event_uuid: testEventUuid,
          sequence_index: 10,
          beat_description: 'Original description'
        });

      const momentUuid = createResponse.body.moment_uuid;

      // Update moment
      const updateResponse = await request(app)
        .put(`/api/moments/${momentUuid}`)
        .send({ beat_description: 'Updated description' })
        .expect(200);

      expect(updateResponse.body.beat_description).toBe('Updated description');
      expect(updateResponse.body.sequence_index).toBe(10); // Unchanged
    });

    test('returns 404 for non-existent moment', async () => {
      await request(app)
        .put('/api/moments/non-existent-uuid')
        .send({ beat_description: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/moments/:momentUuid', () => {
    test('deletes moment successfully', async () => {
      // Create moment
      const createResponse = await request(app)
        .post('/api/moments')
        .send({
          event_uuid: testEventUuid,
          sequence_index: 99,
          beat_description: 'To be deleted'
        });

      const momentUuid = createResponse.body.moment_uuid;

      // Delete moment
      await request(app)
        .delete(`/api/moments/${momentUuid}`)
        .expect(204);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/moments/${testEventUuid}`)
        .expect(200);

      const deleted = getResponse.body.find(m => m.moment_uuid === momentUuid);
      expect(deleted).toBeUndefined();
    });

    test('returns 404 for non-existent moment', async () => {
      await request(app)
        .delete('/api/moments/non-existent-uuid')
        .expect(404);
    });
  });
});
