import assert from 'node:assert/strict';
import { observationSante } from '../service.js';
import type { PlatformHealth, HealthLevel } from '../../smart-engine/services/platform-health.js';
const snapshot=(levels:HealthLevel[]):PlatformHealth=>({generatedAt:new Date().toISOString(),overall:levels.includes('red')?'red':levels.includes('yellow')?'yellow':'green',categories:levels.map((level,i)=>({key:String(i),label:String(i),level,headline:'',detail:''}))});
assert.match(observationSante(snapshot(['green','green'])), /2 domaine\(s\) mesuré\(s\), 0 hors état normal/);
assert.match(observationSante(snapshot(['green','yellow','red','green'])), /4 domaine\(s\) mesuré\(s\), 2 hors état normal/);
assert.match(observationSante(snapshot(['red'])), /1 hors état normal \(état global : red\)/);
console.log('PASS: Smart observation no longer labels healthy green categories abnormal; yellow/red remain visible.');
