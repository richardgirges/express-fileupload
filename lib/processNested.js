const OBJECT_PROTOTYPE_KEYS = Object.getOwnPropertyNames(Object.prototype);
const ARRAY_PROTOTYPE_KEYS = Object.getOwnPropertyNames(Array.prototype);


module.exports = function(data){
  if (!data || data.length < 1) return {};
  
  let d = {},
    keys = Object.keys(data);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i],
      value = data[key],
      current = d,
      keyParts = key
        .replace(new RegExp(/\[/g), '.')
        .replace(new RegExp(/\]/g), '')
        .split('.');  

    for (let index = 0; index < keyParts.length; index++){
      let k = keyParts[index];

      // Ensure we don't allow prototype pollution
      const IN_ARRAY_PROTOTYPE = ARRAY_PROTOTYPE_KEYS.includes(k) && Array.isArray(current);
      if (OBJECT_PROTOTYPE_KEYS.includes(k) || IN_ARRAY_PROTOTYPE) {
        continue;
      }

      if (index >= keyParts.length - 1){
        current[k] = value;
      } else {
        if (!current[k]) current[k] = !isNaN(keyParts[index + 1]) ? [] : {};
        current = current[k];
      }
    }
  }
  
  
  
  return d;
};
