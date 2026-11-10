import test from 'node:test';
import assert from 'node:assert/strict';
import {validateVocabulary} from '../vocabulary.js';
const word={id:'test-1',de:' Haus ',en:' house; home ',group:' Unit 1 '};
test('Vokabeln werden normalisiert; zusätzliche Felder entfernt',()=>assert.deepEqual(validateVocabulary({words:[{...word,secret:'x'}]}),{words:[{id:'test-1',de:'Haus',en:'house; home',group:'Unit 1'}]}));
test('Leere Sammlung ist erlaubt',()=>assert.deepEqual(validateVocabulary({words:[]}),{words:[]}));
test('Doppelte IDs und fehlende Übersetzungen werden abgelehnt',()=>{for(const words of [[word,word],[{...word,en:' '}],[{...word,de:null}],[{...word,id:'../x'}]])assert.throws(()=>validateVocabulary({words}),/Ungültig/);});
test('Längen- und Mengenbegrenzungen greifen',()=>{assert.throws(()=>validateVocabulary({words:[{...word,en:'x'.repeat(301)}]}));assert.throws(()=>validateVocabulary({words:Array(10001).fill(word)}));assert.throws(()=>validateVocabulary({words:null}));});
