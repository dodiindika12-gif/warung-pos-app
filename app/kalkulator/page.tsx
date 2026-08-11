'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function KalkulatorPage() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isResult, setIsResult] = useState(false);

  const handleNumber = (num: string) => {
    if (isResult) {
      setDisplay(num);
      setEquation('');
      setIsResult(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (isResult) {
      setEquation(display + ' ' + op + ' ');
      setDisplay('0');
      setIsResult(false);
    } else {
      setEquation(equation + display + ' ' + op + ' ');
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor as a safer alternative to eval for simple math
      const result = new Function('return ' + fullEquation)();
      
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
      } else {
        // Format to avoid long decimals
        const formattedResult = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString();
        setDisplay(formattedResult);
        setEquation(fullEquation + ' =');
      }
      setIsResult(true);
    } catch (e) {
      setDisplay('Error');
      setIsResult(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsResult(false);
  };

  const handleDelete = () => {
    if (isResult) {
      handleClear();
    } else {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    }
  };

  const handleDecimal = () => {
    if (isResult) {
      setDisplay('0.');
      setEquation('');
      setIsResult(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  return (
    <div className="flex w-full h-full p-0 md:p-8 overflow-y-auto pb-0 md:pb-8 items-center justify-center bg-gray-50/50">
      <div className="w-full h-full md:h-auto md:max-w-md mx-auto flex flex-col md:shadow-2xl md:rounded-[32px] overflow-hidden border-0 md:border border-gray-100 bg-white">
        
        {/* Header */}
        <div className="p-4 md:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-primary/10 shrink-0">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span>🧮</span> Kalkulator
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Hitung cepat untuk kebutuhan warung</p>
        </div>

        {/* Display Area */}
        <div className="p-6 md:p-8 bg-white flex flex-col justify-end shrink-0 h-36 md:h-40 border-b border-gray-50">
          <div className="text-lg md:text-xl font-semibold text-gray-400 text-right h-8 overflow-hidden tracking-wider mb-2">
            {equation}
          </div>
          <div className="text-5xl md:text-6xl font-black text-gray-800 text-right truncate tracking-tight">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 md:p-6 bg-gray-50/80 grid grid-cols-4 gap-2 md:gap-3 flex-1 md:flex-none pb-[10px] md:pb-6">
          {/* Row 1 */}
          <Button onClick={handleClear} className="col-span-2 h-full md:h-16 rounded-2xl md:rounded-3xl bg-red-100 text-red-600 hover:bg-red-200 font-bold text-xl md:text-2xl shadow-sm border-0 transition-transform active:scale-95">
            AC
          </Button>
          <Button onClick={handleDelete} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-orange-100 text-orange-600 hover:bg-orange-200 font-bold text-xl md:text-2xl shadow-sm border-0 transition-transform active:scale-95">
            DEL
          </Button>
          <Button onClick={() => handleOperator('/')} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-primary/10 text-primary hover:bg-primary/20 font-black text-3xl md:text-4xl shadow-sm border-0 transition-transform active:scale-95">
            ÷
          </Button>

          {/* Row 2 */}
          <Button onClick={() => handleNumber('7')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">7</Button>
          <Button onClick={() => handleNumber('8')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">8</Button>
          <Button onClick={() => handleNumber('9')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">9</Button>
          <Button onClick={() => handleOperator('*')} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-primary/10 text-primary hover:bg-primary/20 font-black text-3xl md:text-4xl shadow-sm border-0 transition-transform active:scale-95">
            ×
          </Button>

          {/* Row 3 */}
          <Button onClick={() => handleNumber('4')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">4</Button>
          <Button onClick={() => handleNumber('5')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">5</Button>
          <Button onClick={() => handleNumber('6')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">6</Button>
          <Button onClick={() => handleOperator('-')} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-primary/10 text-primary hover:bg-primary/20 font-black text-4xl md:text-5xl shadow-sm border-0 transition-transform active:scale-95">
            -
          </Button>

          {/* Row 4 */}
          <Button onClick={() => handleNumber('1')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">1</Button>
          <Button onClick={() => handleNumber('2')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">2</Button>
          <Button onClick={() => handleNumber('3')} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">3</Button>
          <Button onClick={() => handleOperator('+')} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-primary/10 text-primary hover:bg-primary/20 font-black text-3xl md:text-4xl shadow-sm border-0 transition-transform active:scale-95">
            +
          </Button>

          {/* Row 5 */}
          <Button onClick={() => handleNumber('0')} variant="outline" className="col-span-2 h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">
            0
          </Button>
          <Button onClick={handleDecimal} variant="outline" className="h-full md:h-16 rounded-2xl md:rounded-3xl font-bold text-2xl md:text-3xl text-gray-700 bg-white shadow-sm border-gray-100 hover:bg-gray-50 transition-transform active:scale-95">
            .
          </Button>
          <Button onClick={handleCalculate} className="h-full md:h-16 rounded-2xl md:rounded-3xl bg-primary text-white hover:bg-primary/90 font-black text-3xl md:text-4xl shadow-md shadow-primary/30 border-0 transition-transform active:scale-95">
            =
          </Button>
        </div>
      </div>
    </div>
  );
}
