class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    return this.items.shift();
  }

  peek() {
    if (this.items.length === 0) return undefined;
    return this.items[0];
  }

  clear() {
    this.items = [];
  }

  getAll() {
    return this.items;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

module.exports = Queue;
