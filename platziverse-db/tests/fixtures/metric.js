'use strict';

const metric = {
  type: 'TEMPERATURE',
  value: '20'
};

const metrics = [metics, extend({ value: '40' })];

function extend(obj, values) {
  const clone = Object.assign({}, obj);
  return Object.assign(clone, values);
}
