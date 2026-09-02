// Axis-Aligned Bounding Box (AABB) Collision Engine

export class AABB {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
  }

  clone() {
    return new AABB(this.minX, this.minY, this.minZ, this.maxX, this.maxY, this.maxZ);
  }

  setPosition(x, y, z, width = 0.6, height = 1.8) {
    const halfW = width / 2;
    this.minX = x - halfW;
    this.maxX = x + halfW;
    this.minY = y;
    this.maxY = y + height;
    this.minZ = z - halfW;
    this.maxZ = z + halfW;
    return this;
  }

  offset(dx, dy, dz) {
    this.minX += dx;
    this.maxX += dx;
    this.minY += dy;
    this.maxY += dy;
    this.minZ += dz;
    this.maxZ += dz;
    return this;
  }

  intersects(other) {
    return (
      this.maxX > other.minX &&
      this.minX < other.maxX &&
      this.maxY > other.minY &&
      this.minY < other.maxY &&
      this.maxZ > other.minZ &&
      this.minZ < other.maxZ
    );
  }

  // Calculate sweep collision distance along X axis against another box
  calculateXOffset(other, dx) {
    if (other.maxY <= this.minY || other.minY >= this.maxY) return dx;
    if (other.maxZ <= this.minZ || other.minZ >= this.maxZ) return dx;

    if (dx > 0 && other.minX >= this.maxX) {
      const maxAllowed = other.minX - this.maxX;
      if (maxAllowed < dx) dx = maxAllowed;
    }
    if (dx < 0 && other.maxX <= this.minX) {
      const minAllowed = other.maxX - this.minX;
      if (minAllowed > dx) dx = minAllowed;
    }
    return dx;
  }

  // Calculate sweep collision distance along Y axis against another box
  calculateYOffset(other, dy) {
    if (other.maxX <= this.minX || other.minX >= this.maxX) return dy;
    if (other.maxZ <= this.minZ || other.minZ >= this.maxZ) return dy;

    if (dy > 0 && other.minY >= this.maxY) {
      const maxAllowed = other.minY - this.maxY;
      if (maxAllowed < dy) dy = maxAllowed;
    }
    if (dy < 0 && other.maxY <= this.minY) {
      const minAllowed = other.maxY - this.minY;
      if (minAllowed > dy) dy = minAllowed;
    }
    return dy;
  }

  // Calculate sweep collision distance along Z axis against another box
  calculateZOffset(other, dz) {
    if (other.maxX <= this.minX || other.minX >= this.maxX) return dz;
    if (other.maxY <= this.minY || other.minY >= this.maxY) return dz;

    if (dz > 0 && other.minZ >= this.maxZ) {
      const maxAllowed = other.minZ - this.maxZ;
      if (maxAllowed < dz) dz = maxAllowed;
    }
    if (dz < 0 && other.maxZ <= this.minZ) {
      const minAllowed = other.maxZ - this.minZ;
      if (minAllowed > dz) dz = minAllowed;
    }
    return dz;
  }
}
