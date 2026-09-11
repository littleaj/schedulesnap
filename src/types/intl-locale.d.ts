export {};

declare global {
  namespace Intl {
    interface Locale {
      getWeekInfo(): {
        firstDay: number;
        weekend: number[];
        minimalDays: number;
      };
    }
  }
}
