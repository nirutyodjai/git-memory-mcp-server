/**
 * Browser-compatible EventEmitter implementation
 * Replaces Node.js EventEmitter for browser environments
 */

export class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, listener?: Function): this {
    if (!this.events.has(event)) {
      return this;
    }

    if (!listener) {
      this.events.delete(event);
      return this;
    }

    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events.has(event)) {
      return false;
    }

    const listeners = this.events.get(event)!.slice();
    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('EventEmitter error:', error);
      }
    }

    return listeners.length > 0;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

export default EventEmitter;