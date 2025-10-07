class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  insert(data) {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
    } else {
      let temp = this.head;
      while (temp.next) temp = temp.next;
      temp.next = newNode;
    }
  }

  deleteByName(name) {
    if (!this.head) return;
    if (this.head.data.name === name) {
      this.head = this.head.next;
      return;
    }
    let temp = this.head;
    while (temp.next && temp.next.data.name !== name) {
      temp = temp.next;
    }
    if (temp.next) temp.next = temp.next.next;
  }

  toArray() {
    const arr = [];
    let temp = this.head;
    while (temp) {
      arr.push(temp.data);
      temp = temp.next;
    }
    return arr;
  }
}

module.exports = LinkedList;
