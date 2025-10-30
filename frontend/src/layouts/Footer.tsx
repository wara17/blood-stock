import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <h5>🩸 ระบบจัดการคลังเลือด</h5>
            <p className="mb-2">
              ระบบบริหารจัดการคลังเลือดแบบครบวงจร เพื่อการให้บริการที่มีประสิทธิภาพ
            </p>
            <small className="text-muted">
              © 2025 Blood Stock Management System. All rights reserved.
            </small>
          </Col>
          <Col md={3}>
            <h6>เมนูหลัก</h6>
            <ul className="list-unstyled">
              <li><a href="/dashboard" className="text-light text-decoration-none">หน้าหลัก</a></li>
              <li><a href="/blood-inventory" className="text-light text-decoration-none">คลังเลือด</a></li>
              <li><a href="/blood-reservation-list" className="text-light text-decoration-none">รายการจอง</a></li>
              <li><a href="#reports" className="text-light text-decoration-none">รายงาน</a></li>
            </ul>
          </Col>
          <Col md={3}>
            <h6>ติดต่อเรา</h6>
            <ul className="list-unstyled">
              <li><small>📧 support@bloodstock.com</small></li>
              <li><small>📞 02-xxx-xxxx</small></li>
              <li><small>🏥 โรงพยาบาล ABC</small></li>
              <li><small>📍 กรุงเทพมหานคร, ประเทศไทย</small></li>
            </ul>
          </Col>
        </Row>
        <hr className="my-3" />
        <Row>
          <Col className="text-center">
            <small className="text-muted">
              พัฒนาโดยทีม IT โรงพยาบาล | เวอร์ชั่น 1.0.0
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;