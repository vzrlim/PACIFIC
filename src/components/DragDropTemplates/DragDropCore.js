// DragDropCore.js - Core drag & drop mechanics and utilities for PACIFIC Learning Templates
// Handles positioning, collision detection, snapping, and component management

export class DragDropManager {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.components = new Map();
    this.draggedComponent = null;
    this.offset = { x: 0, y: 0 };
    this.isDragging = false;
    this.gridSize = options.gridSize || 10;
    this.snapToGrid = options.snapToGrid !== false;
    this.collisionDetection = options.collisionDetection !== false;
    this.boundaries = options.boundaries || this.getCanvasBoundaries();
    
    // Event listeners
    this.boundHandlers = {
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this)
    };
    
    this.initializeEventListeners();
  }

  getCanvasBoundaries() {
    const rect = this.canvas.getBoundingClientRect();
    return {
      left: 0,
      top: 0,
      right: rect.width,
      bottom: rect.height
    };
  }

  initializeEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.boundHandlers.mouseDown, { passive: false });
    document.addEventListener('mousemove', this.boundHandlers.mouseMove, { passive: false });
    document.addEventListener('mouseup', this.boundHandlers.mouseUp, { passive: false });
    
    // Touch events for mobile support
    this.canvas.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    document.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    document.addEventListener('touchend', this.boundHandlers.touchEnd, { passive: false });
  }

  // Component Management
  addComponent(id, element, initialPosition = { x: 50, y: 50 }) {
    const component = {
      id,
      element,
      position: { ...initialPosition },
      size: this.getElementSize(element),
      zIndex: this.getNextZIndex(),
      locked: false,
      visible: true,
      type: element.dataset.componentType || 'unknown',
      data: {}
    };

    this.components.set(id, component);
    this.updateComponentPosition(component);
    this.makeComponentDraggable(element, id);
    
    return component;
  }

  removeComponent(id) {
    const component = this.components.get(id);
    if (component) {
      component.element.remove();
      this.components.delete(id);
    }
  }

  getComponent(id) {
    return this.components.get(id);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  // Position and Size Management
  getElementSize(element) {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }

  updateComponentPosition(component) {
    const { x, y } = component.position;
    component.element.style.position = 'absolute';
    component.element.style.left = `${x}px`;
    component.element.style.top = `${y}px`;
    component.element.style.zIndex = component.zIndex;
  }

  snapToGrid(position) {
    if (!this.snapToGrid) return position;
    
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  constrainToBoundaries(position, size) {
    const constrained = { ...position };
    
    // Left boundary
    constrained.x = Math.max(this.boundaries.left, constrained.x);
    // Right boundary
    constrained.x = Math.min(this.boundaries.right - size.width, constrained.x);
    // Top boundary
    constrained.y = Math.max(this.boundaries.top, constrained.y);
    // Bottom boundary
    constrained.y = Math.min(this.boundaries.bottom - size.height, constrained.y);
    
    return constrained;
  }

  // Collision Detection
  checkCollision(component1, component2) {
    const box1 = this.getComponentBoundingBox(component1);
    const box2 = this.getComponentBoundingBox(component2);
    
    return !(
      box1.right < box2.left || 
      box1.left > box2.right || 
      box1.bottom < box2.top || 
      box1.top > box2.bottom
    );
  }

  getComponentBoundingBox(component) {
    return {
      left: component.position.x,
      top: component.position.y,
      right: component.position.x + component.size.width,
      bottom: component.position.y + component.size.height
    };
  }

  findCollisions(targetComponent) {
    const collisions = [];
    
    for (const [id, component] of this.components) {
      if (id !== targetComponent.id && component.visible && this.checkCollision(targetComponent, component)) {
        collisions.push(component);
      }
    }
    
    return collisions;
  }

  resolveCollisions(component, newPosition) {
    if (!this.collisionDetection) return newPosition;
    
    const testComponent = { ...component, position: newPosition };
    const collisions = this.findCollisions(testComponent);
    
    if (collisions.length === 0) return newPosition;
    
    // Simple collision resolution - find nearest non-colliding position
    const candidates = [
      { x: newPosition.x + 10, y: newPosition.y },
      { x: newPosition.x - 10, y: newPosition.y },
      { x: newPosition.x, y: newPosition.y + 10 },
      { x: newPosition.x, y: newPosition.y - 10 },
      { x: newPosition.x + 10, y: newPosition.y + 10 },
      { x: newPosition.x - 10, y: newPosition.y - 10 }
    ];
    
    for (const candidate of candidates) {
      const testPos = this.constrainToBoundaries(candidate, component.size);
      const testComp = { ...component, position: testPos };
      
      if (this.findCollisions(testComp).length === 0) {
        return testPos;
      }
    }
    
    // If no resolution found, return original position
    return component.position;
  }

  // Z-Index Management
  getNextZIndex() {
    let maxZ = 0;
    for (const component of this.components.values()) {
      maxZ = Math.max(maxZ, component.zIndex);
    }
    return maxZ + 1;
  }

  bringToFront(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.zIndex = this.getNextZIndex();
      this.updateComponentPosition(component);
    }
  }

  sendToBack(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.zIndex = 0;
      // Adjust other components
      for (const [id, comp] of this.components) {
        if (id !== componentId && comp.zIndex > 0) {
          comp.zIndex++;
          this.updateComponentPosition(comp);
        }
      }
      this.updateComponentPosition(component);
    }
  }

  // Drag and Drop Event Handlers
  makeComponentDraggable(element, componentId) {
    element.style.cursor = 'move';
    element.dataset.componentId = componentId;
    element.classList.add('pacific-draggable-component');
  }

  getEventPosition(event) {
    const canvasRect = this.canvas.getBoundingClientRect();
    
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - canvasRect.left,
        y: event.touches[0].clientY - canvasRect.top
      };
    }
    
    return {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    };
  }

  startDrag(element, eventPosition) {
    const componentId = element.dataset.componentId;
    const component = this.components.get(componentId);
    
    if (!component || component.locked) return false;
    
    this.draggedComponent = component;
    this.isDragging = true;
    
    // Calculate offset between mouse and component top-left
    this.offset = {
      x: eventPosition.x - component.position.x,
      y: eventPosition.y - component.position.y
    };
    
    // Bring to front
    this.bringToFront(componentId);
    
    // Add dragging class for visual feedback
    element.classList.add('pacific-dragging');
    
    // Prevent default browser behavior
    return true;
  }

  updateDrag(eventPosition) {
    if (!this.isDragging || !this.draggedComponent) return;
    
    // Calculate new position
    let newPosition = {
      x: eventPosition.x - this.offset.x,
      y: eventPosition.y - this.offset.y
    };
    
    // Apply grid snapping
    newPosition = this.snapToGrid(newPosition);
    
    // Constrain to boundaries
    newPosition = this.constrainToBoundaries(newPosition, this.draggedComponent.size);
    
    // Resolve collisions
    newPosition = this.resolveCollisions(this.draggedComponent, newPosition);
    
    // Update position
    this.draggedComponent.position = newPosition;
    this.updateComponentPosition(this.draggedComponent);
    
    // Trigger position change event
    this.triggerEvent('componentMoved', {
      componentId: this.draggedComponent.id,
      position: newPosition
    });
  }

  endDrag() {
    if (this.draggedComponent) {
      this.draggedComponent.element.classList.remove('pacific-dragging');
      
      // Trigger drag end event
      this.triggerEvent('componentDragEnd', {
        componentId: this.draggedComponent.id,
        position: this.draggedComponent.position
      });
    }
    
    this.draggedComponent = null;
    this.isDragging = false;
    this.offset = { x: 0, y: 0 };
  }

  // Mouse Event Handlers
  handleMouseDown(event) {
    const target = event.target.closest('.pacific-draggable-component');
    if (!target) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const eventPosition = this.getEventPosition(event);
    if (this.startDrag(target, eventPosition)) {
      this.triggerEvent('componentDragStart', {
        componentId: target.dataset.componentId
      });
    }
  }

  handleMouseMove(event) {
    if (!this.isDragging) return;
    
    event.preventDefault();
    const eventPosition = this.getEventPosition(event);
    this.updateDrag(eventPosition);
  }

  handleMouseUp(event) {
    if (this.isDragging) {
      event.preventDefault();
      this.endDrag();
    }
  }

  // Touch Event Handlers (Mobile Support)
  handleTouchStart(event) {
    const target = event.target.closest('.pacific-draggable-component');
    if (!target) return;
    
    event.preventDefault();
    const eventPosition = this.getEventPosition(event);
    if (this.startDrag(target, eventPosition)) {
      this.triggerEvent('componentDragStart', {
        componentId: target.dataset.componentId
      });
    }
  }

  handleTouchMove(event) {
    if (!this.isDragging) return;
    
    event.preventDefault();
    const eventPosition = this.getEventPosition(event);
    this.updateDrag(eventPosition);
  }

  handleTouchEnd(event) {
    if (this.isDragging) {
      event.preventDefault();
      this.endDrag();
    }
  }

  // Event System
  triggerEvent(eventName, data) {
    const event = new CustomEvent(`pacific:${eventName}`, {
      detail: data
    });
    this.canvas.dispatchEvent(event);
  }

  // Component Serialization
  serializeComponents() {
    const serialized = [];
    
    for (const [id, component] of this.components) {
      serialized.push({
        id,
        type: component.type,
        position: { ...component.position },
        size: { ...component.size },
        zIndex: component.zIndex,
        locked: component.locked,
        visible: component.visible,
        data: { ...component.data }
      });
    }
    
    return serialized;
  }

  deserializeComponents(serializedData, componentFactory) {
    this.clear();
    
    // Sort by z-index to maintain layer order
    const sorted = serializedData.sort((a, b) => a.zIndex - b.zIndex);
    
    for (const componentData of sorted) {
      if (typeof componentFactory === 'function') {
        const element = componentFactory(componentData);
        if (element) {
          const component = this.addComponent(componentData.id, element, componentData.position);
          
          // Restore additional properties
          component.zIndex = componentData.zIndex;
          component.locked = componentData.locked;
          component.visible = componentData.visible;
          component.data = { ...componentData.data };
          
          this.updateComponentPosition(component);
          
          if (!componentData.visible) {
            element.style.display = 'none';
          }
        }
      }
    }
  }

  // Utility Methods
  clear() {
    for (const [id] of this.components) {
      this.removeComponent(id);
    }
  }

  lockComponent(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.locked = true;
      component.element.style.cursor = 'default';
      component.element.classList.add('pacific-locked');
    }
  }

  unlockComponent(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.locked = false;
      component.element.style.cursor = 'move';
      component.element.classList.remove('pacific-locked');
    }
  }

  hideComponent(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.visible = false;
      component.element.style.display = 'none';
    }
  }

  showComponent(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      component.visible = true;
      component.element.style.display = '';
    }
  }

  // Cleanup
  destroy() {
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.canvas.removeEventListener('touchstart', this.boundHandlers.touchStart);
    document.removeEventListener('touchmove', this.boundHandlers.touchMove);
    document.removeEventListener('touchend', this.boundHandlers.touchEnd);
    
    // Clear components
    this.clear();
  }
}

// Utility functions for drag and drop operations
export const DragDropUtils = {
  // Generate unique IDs for components
  generateId: (prefix = 'component') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Calculate distance between two points
  distance: (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Check if point is inside rectangle
  pointInRect: (point, rect) => {
    return point.x >= rect.left && 
           point.x <= rect.right && 
           point.y >= rect.top && 
           point.y <= rect.bottom;
  },

  // Calculate optimal placement for new component
  findOptimalPlacement: (existingComponents, newComponentSize, canvasBounds) => {
    const gridSize = 20;
    const margin = 10;
    
    // Try positions in a grid pattern
    for (let y = margin; y < canvasBounds.bottom - newComponentSize.height; y += gridSize) {
      for (let x = margin; x < canvasBounds.right - newComponentSize.width; x += gridSize) {
        const testPosition = { x, y };
        const testBounds = {
          left: x,
          top: y,
          right: x + newComponentSize.width,
          bottom: y + newComponentSize.height
        };
        
        // Check if this position conflicts with existing components
        let hasConflict = false;
        for (const component of existingComponents) {
          if (component.visible) {
            const compBounds = {
              left: component.position.x,
              top: component.position.y,
              right: component.position.x + component.size.width,
              bottom: component.position.y + component.size.height
            };
            
            if (!(testBounds.right < compBounds.left || 
                  testBounds.left > compBounds.right || 
                  testBounds.bottom < compBounds.top || 
                  testBounds.top > compBounds.bottom)) {
              hasConflict = true;
              break;
            }
          }
        }
        
        if (!hasConflict) {
          return testPosition;
        }
      }
    }
    
    // If no optimal position found, return default
    return { x: margin, y: margin };
  },

  // Align components
  alignComponents: (components, alignment) => {
    if (components.length < 2) return;
    
    const positions = components.map(comp => ({ ...comp.position }));
    
    switch (alignment) {
      case 'left':
        const leftMost = Math.min(...positions.map(p => p.x));
        components.forEach(comp => comp.position.x = leftMost);
        break;
        
      case 'right':
        const rightMost = Math.max(...components.map(comp => comp.position.x + comp.size.width));
        components.forEach(comp => comp.position.x = rightMost - comp.size.width);
        break;
        
      case 'top':
        const topMost = Math.min(...positions.map(p => p.y));
        components.forEach(comp => comp.position.y = topMost);
        break;
        
      case 'bottom':
        const bottomMost = Math.max(...components.map(comp => comp.position.y + comp.size.height));
        components.forEach(comp => comp.position.y = bottomMost - comp.size.height);
        break;
        
      case 'center-horizontal':
        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        components.forEach(comp => comp.position.x = avgX - comp.size.width / 2);
        break;
        
      case 'center-vertical':
        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        components.forEach(comp => comp.position.y = avgY - comp.size.height / 2);
        break;
    }
  },

  // Distribute components evenly
  distributeComponents: (components, direction = 'horizontal') => {
    if (components.length < 3) return;
    
    components.sort((a, b) => {
      return direction === 'horizontal' 
        ? a.position.x - b.position.x
        : a.position.y - b.position.y;
    });
    
    const first = components[0];
    const last = components[components.length - 1];
    
    if (direction === 'horizontal') {
      const totalSpace = last.position.x - first.position.x;
      const spacing = totalSpace / (components.length - 1);
      
      components.forEach((comp, index) => {
        comp.position.x = first.position.x + (spacing * index);
      });
    } else {
      const totalSpace = last.position.y - first.position.y;
      const spacing = totalSpace / (components.length - 1);
      
      components.forEach((comp, index) => {
        comp.position.y = first.position.y + (spacing * index);
      });
    }
  }
};