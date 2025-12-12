export const ListStorage = {
  getLists() {
    const data = localStorage.getItem("customLists");
    return data ? JSON.parse(data) : [];
  },
  saveList(list) {
    const lists = this.getLists();
    const index = lists.findIndex((l) => l.id === list.id);
    if (index >= 0) {
      lists[index] = list;
    } else {
      list.id = Date.now().toString();
      lists.push(list);
    }
    localStorage.setItem("customLists", JSON.stringify(lists));
    return list;
  },
  deleteList(id) {
    const lists = this.getLists().filter((l) => l.id !== id);
    localStorage.setItem("customLists", JSON.stringify(lists));
  },
};

export const HistoryStorage = {
  getHistory() {
    const data = localStorage.getItem("decisionHistory");
    return data ? JSON.parse(data) : [];
  },
  addEntry(entry) {
    const history = this.getHistory();
    history.unshift(entry);
    localStorage.setItem("decisionHistory", JSON.stringify(history));
  },
  deleteEntry(id) {
    const history = this.getHistory().filter((item) => item.id !== id);
    localStorage.setItem("decisionHistory", JSON.stringify(history));
  },
  clear() {
    localStorage.removeItem("decisionHistory");
  },
};
