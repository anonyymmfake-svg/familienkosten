import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validate} from '../validation.js';
const valid=()=>({people:[{id:'p1',name:'Alex'}],rows:[{id:'r1',name:'Sport',amounts:{p1:1299}}]});
test('Euro-Cent bleiben ganzzahlig und Namen werden normalisiert',()=>{const data=valid();data.people[0].name=' Alex ';assert.equal(validate(data).people[0].name,'Alex');assert.equal(validate(data).rows[0].amounts.p1,1299);});
test('negative, gebrochene, überhöhte und fremde Beträge werden abgewiesen',()=>{for(const value of [-1,0.1,Infinity,100000001,'12']){const data=valid();data.rows[0].amounts.p1=value;assert.throws(()=>validate(data));}const data=valid();data.rows[0].amounts.unknown=100;assert.throws(()=>validate(data));});
test('doppelte IDs und leere Namen werden abgewiesen',()=>{const data=valid();data.people.push({...data.people[0]});assert.throws(()=>validate(data));const other=valid();other.rows[0].name=' ';assert.throws(()=>validate(other));});
