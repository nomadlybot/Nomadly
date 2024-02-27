// function get(table, key) {
//   return table[key];
// }
// function set(table, key, value) {
//   table[key] = value;
// }
// del should be some mark X instead of del

const increment = async (c, key, val = 1, valueInside) => {
  try {
    if (valueInside) {
      const count = (await get(c, key))?.[val] || 0
      await set(c, key, val, Number(count) + Number(valueInside))
      return
    }

    const count = (await get(c, key)) || 0
    await set(c, key, count + val)
  } catch (error) {
    console.error(`Error increment: ${key} from ${c.collectionName}:`, error)
    return null
  }
}

const decrement = async (c, key) => {
  try {
    const count = (await get(c, key)) || 0
    await set(c, key, count - 1)
  } catch (error) {
    console.error(`Error db decrement ${key} from ${c.collectionName}:`, error)
    return null
  }
}

async function get(c, key) {
  try {
    const result = await c.findOne({ _id: key })
    // console.log({ findIn: c.collectionName, key, result });
    if (result?.val === 0) return 0
    if (result?.val === false) return false
    if (result?.val === null) return null

    return result?.val || result || undefined
  } catch (error) {
    console.error(`Error get: ${key} from ${c.collectionName}:`, error)
    return null
  }
}

async function getAll(c) {
  try {
    const result = await c.find({}).toArray()
    return result
  } catch (error) {
    console.error(`Error getAll: ${c}:`, error)
    return null
  }
}

async function set(c, key, value, valueInside) {
  try {
    if (valueInside === undefined) {
      await c.updateOne({ _id: key }, { $set: { val: value } }, { upsert: true })
    } else {
      await c.updateOne({ _id: key }, { $set: { [value]: valueInside } }, { upsert: true })
    }

    // let a = JSON.stringify(valueInside);
    // a = a === undefined ? '' : ` ${a}`;
    // console.log(`${key}: ${JSON.stringify(value)}${a} set in ${c.collectionName}`);
  } catch (error) {
    console.error(`Error set: ${key} -> ${JSON.stringify(value)} in ${c.collectionName}:`, error)
  }
}

async function del(c, _id) {
  try {
    const result = await c.deleteOne({ _id })
    // console.log(`Deleted ${result.deletedCount >= 1 ? 'True' : 'False'} in ${c.collectionName}`);
    return result.deletedCount === 1
  } catch (error) {
    console.error('Error del:', error)
    return false
  }
}

module.exports = { increment, decrement, get, set, del, getAll }
