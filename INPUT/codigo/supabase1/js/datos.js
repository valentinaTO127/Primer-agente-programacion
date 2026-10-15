// 3rd script: data access layer (CRUD).
// Uses `supabaseClient` defined in supabaseClient.js.

const TABLE_NAME = "productos_practica"; // replace with your real table name

async function getItems() {
  const { data, error } = await supabaseClient.from(TABLE_NAME).select("*");
  if (error) {
    console.error("getItems:", error.message);
    return [];
  }
  return data;
}

async function addItem(item) {
  const { data, error } = await supabaseClient.from(TABLE_NAME).insert(item).select();
  if (error) {
    console.error("addItem:", error.message);
    return null;
  }
  return data[0];
}

async function updateItem(id, changes) {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .update(changes)
    .eq("id", id)
    .select();
  if (error) {
    console.error("updateItem:", error.message);
    return null;
  }
  return data[0];
}

async function deleteItem(id) {
  const { error } = await supabaseClient.from(TABLE_NAME).delete().eq("id", id);
  if (error) {
    console.error("deleteItem:", error.message);
    return false;
  }
  return true;
}
