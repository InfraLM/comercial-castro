export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function getWeekDateRange(weekNumber: number, year: number): { inicio: string; fim: string; inicioFormatado: string; fimFormatado: string } {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };
  
  return {
    inicio: ISOweekStart.toISOString().split('T')[0],
    fim: ISOweekEnd.toISOString().split('T')[0],
    inicioFormatado: formatDate(ISOweekStart),
    fimFormatado: formatDate(ISOweekEnd)
  };
}

export function formatTempo(segundos: number): string {
  if (!segundos || isNaN(segundos)) return "0m 0s";
  
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  }
  return `${minutos}m ${segs}s`;
}

export function parseTimeToSeconds(timeString: string): number {
  if (!timeString) return 0;
  const parts = timeString.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

export function getIndicatorColor(
  metrica: 'no_show' | 'ligacoes_reuniao_m' | 'ligacoes_reuniao_r' | 'taxa_conversao',
  valor: number
): 'green' | 'red' {
  switch(metrica) {
    case 'no_show':
      return valor < 25 ? 'green' : 'red';
    case 'ligacoes_reuniao_m':
      return valor < 15 ? 'green' : 'red';
    case 'ligacoes_reuniao_r':
      return valor < 20 ? 'green' : 'red';
    case 'taxa_conversao':
      return valor >= 25 ? 'green' : 'red';
    default:
      return 'red';
  }
}

export function formatDateToBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}
