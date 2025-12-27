import { Availability, TimeSlot } from '@/domain/entities/availability';
import { ValidationError, BusinessRuleError } from '@/domain/errors';

describe('Availability Entity', () => {
  it('should create a valid availability', () => {
    const slots: TimeSlot[] = [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' },
    ];

    const availability = new Availability({
      providerId: 'provider-123',
      dayOfWeek: 1,
      slots,
    });

    expect(availability.id).toBeDefined();
    expect(availability.providerId).toBe('provider-123');
    expect(availability.dayOfWeek).toBe(1);
    expect(availability.slots).toHaveLength(2);
    expect(availability.isActive).toBe(true);
    expect(availability.getDayName()).toBe('Segunda-feira');
  });

  it('should throw error for invalid day of week', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 7,
        slots: [{ start: '09:00', end: '12:00' }],
      });
    }).toThrow(ValidationError);
  });

  it('should throw error for invalid time format', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots: [{ start: '25:00', end: '12:00' }],
      });
    }).toThrow(ValidationError);
  });

  it('should throw error when end time is before start time', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots: [{ start: '18:00', end: '09:00' }],
      });
    }).toThrow(ValidationError);
  });

  it('should throw error for slot duration less than 15 minutes', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots: [{ start: '09:00', end: '09:10' }],
      });
    }).toThrow(ValidationError);
  });

  it('should throw error for overlapping slots', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots: [
          { start: '09:00', end: '12:00' },
          { start: '11:00', end: '14:00' },
        ],
      });
    }).toThrow(BusinessRuleError);
  });

  it('should throw error for empty slots array', () => {
    expect(() => {
      new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots: [],
      });
    }).toThrow(ValidationError);
  });

  it('should update slots correctly', () => {
    const availability = new Availability({
      providerId: 'provider-123',
      dayOfWeek: 1,
      slots: [{ start: '09:00', end: '12:00' }],
    });

    const newSlots: TimeSlot[] = [
      { start: '08:00', end: '11:00' },
      { start: '13:00', end: '17:00' },
    ];

    availability.updateSlots(newSlots);

    expect(availability.slots).toHaveLength(2);
    expect(availability.slots[0].start).toBe('08:00');
  });

  it('should activate and deactivate correctly', () => {
    const availability = new Availability({
      providerId: 'provider-123',
      dayOfWeek: 1,
      slots: [{ start: '09:00', end: '12:00' }],
    });

    expect(availability.isActive).toBe(true);

    availability.deactivate();
    expect(availability.isActive).toBe(false);

    availability.activate();
    expect(availability.isActive).toBe(true);
  });

  it('should check if time is available correctly', () => {
    const availability = new Availability({
      providerId: 'provider-123',
      dayOfWeek: 1,
      slots: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
    });

    expect(availability.isTimeAvailable('09:00')).toBe(true);
    expect(availability.isTimeAvailable('10:30')).toBe(true);
    expect(availability.isTimeAvailable('14:00')).toBe(true);

    expect(availability.isTimeAvailable('08:00')).toBe(false);
    expect(availability.isTimeAvailable('12:30')).toBe(false);
    expect(availability.isTimeAvailable('18:30')).toBe(false);
  });

  describe('Availability Entity - Performance', () => {
    it('should validate 1000 slots without timeout', () => {
      const slots: TimeSlot[] = [];
      for (let i = 0; i < 1000; i++) {
        const start = i * 30;
        const end = start + 20;
        const startHour = Math.floor(start / 60) % 24;
        const startMin = start % 60;
        const endHour = Math.floor(end / 60) % 24;
        const endMin = end % 60;

        slots.push({
          start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
          end: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
        });
      }

      const startTime = performance.now();

      const availability = new Availability({
        providerId: 'provider-123',
        dayOfWeek: 1,
        slots,
      });

      const duration = performance.now() - startTime;

      expect(availability).toBeDefined();
      expect(duration).toBeLessThan(100);
      console.log(
        `✅ Validou ${slots.length} slots em ${duration.toFixed(2)}ms`,
      );
    });
  });
});
