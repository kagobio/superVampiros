import { describe, expect, it } from 'vitest';
import { shouldApplyIncoming, toDocument } from './reconcile';
import { baseEntity } from '@/domain/shared/entity';

describe('shouldApplyIncoming', () => {
  it('aplica si no hay local', () => {
    expect(shouldApplyIncoming(undefined, { updatedAt: 1, revision: 1 })).toBe(true);
  });

  it('gana el updatedAt mayor', () => {
    expect(
      shouldApplyIncoming({ updatedAt: 10, revision: 1 }, { updatedAt: 20, revision: 1 }),
    ).toBe(true);
    expect(
      shouldApplyIncoming({ updatedAt: 20, revision: 1 }, { updatedAt: 10, revision: 5 }),
    ).toBe(false);
  });

  it('en empate de updatedAt, gana la revisión mayor', () => {
    expect(
      shouldApplyIncoming({ updatedAt: 10, revision: 2 }, { updatedAt: 10, revision: 3 }),
    ).toBe(true);
    expect(
      shouldApplyIncoming({ updatedAt: 10, revision: 3 }, { updatedAt: 10, revision: 3 }),
    ).toBe(false);
  });
});

describe('toDocument', () => {
  it('mapea una entidad a una fila de documents', () => {
    const entity = { ...baseEntity('abc', 123), updatedAt: 123, revision: 1 };
    const doc = toDocument('house-1', 'product', entity);
    expect(doc).toMatchObject({
      household_id: 'house-1',
      entity_type: 'product',
      entity_id: 'abc',
      updated_at: 123,
      revision: 1,
    });
    expect(doc.doc).toBe(entity);
  });
});
