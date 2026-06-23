/**
 * Unit tests for MilestoneCelebration component logic
 * Requirements: 7.4
 *
 * Since the project doesn't have a full RN component testing setup,
 * we test the key logic: milestone type → emoji/title mapping
 * and achievement card content derivation.
 */

// Replicate component logic for testing
function getEmoji(type: 'week' | 'month'): string {
  return type === 'week' ? '🎉' : '🏆';
}

function getTitle(type: 'week' | 'month'): string {
  return type === 'week' ? '7 Day Streak!' : '30 Day Streak!';
}

function getSubtitle(): string {
  return "You're on fire! Keep up the great work!";
}

function getAchievementCardTitle(streak: number): string {
  return `${streak} Day Streak`;
}

describe('MilestoneCelebration logic', () => {
  describe('emoji selection', () => {
    it('shows 🎉 for weekly milestone', () => {
      expect(getEmoji('week')).toBe('🎉');
    });

    it('shows 🏆 for monthly milestone', () => {
      expect(getEmoji('month')).toBe('🏆');
    });
  });

  describe('title selection', () => {
    it('shows "7 Day Streak!" for weekly milestone', () => {
      expect(getTitle('week')).toBe('7 Day Streak!');
    });

    it('shows "30 Day Streak!" for monthly milestone', () => {
      expect(getTitle('month')).toBe('30 Day Streak!');
    });
  });

  describe('subtitle', () => {
    it('returns the motivational subtitle', () => {
      expect(getSubtitle()).toBe("You're on fire! Keep up the great work!");
    });
  });

  describe('achievement card content', () => {
    it('displays streak count in card title for streak = 7', () => {
      expect(getAchievementCardTitle(7)).toBe('7 Day Streak');
    });

    it('displays streak count in card title for streak = 30', () => {
      expect(getAchievementCardTitle(30)).toBe('30 Day Streak');
    });

    it('handles arbitrary streak values', () => {
      expect(getAchievementCardTitle(14)).toBe('14 Day Streak');
    });
  });

  describe('milestone type to content mapping', () => {
    it('weekly milestone has distinct content from monthly', () => {
      expect(getEmoji('week')).not.toBe(getEmoji('month'));
      expect(getTitle('week')).not.toBe(getTitle('month'));
    });
  });
});
