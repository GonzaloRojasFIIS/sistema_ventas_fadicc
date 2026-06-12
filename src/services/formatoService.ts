export function numeroALetras(num: number): string {
  const unidades = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
  const decenas = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  const especiales = ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  const centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

  function grupo(n: number): string {
    if (n === 0) return '';
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (u === 0) return decenas[d];
      if (d === 2) return 'VEINTI' + unidades[u].toLowerCase();
      return decenas[d] + ' Y ' + unidades[u];
    }
    const c = Math.floor(n / 100);
    const r = n % 100;
    if (n === 100) return 'CIEN';
    if (r === 0) return centenas[c];
    return centenas[c] + ' ' + grupo(r);
  }

  function convertir(n: number): string {
    if (n === 0) return 'CERO';
    if (n < 1000) return grupo(n);
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      const r = n % 1000;
      const gm = m === 1 ? 'UN' : convertir(m);
      if (r === 0) return gm + ' MIL';
      return gm + ' MIL ' + convertir(r);
    }
    if (n < 1000000000) {
      const mill = Math.floor(n / 1000000);
      const r = n % 1000000;
      const gmill = mill === 1 ? 'UN MILLON' : convertir(mill) + ' MILLONES';
      if (r === 0) return gmill;
      return gmill + ' ' + convertir(r);
    }
    return 'NÚMERO MUY GRANDE';
  }

  const entero = Math.floor(num);
  const decimal = Math.round((num - entero) * 100);
  return convertir(entero) + ' CON ' + decimal.toString().padStart(2, '0') + '/100 SOLES';
}
