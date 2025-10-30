import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="danger" variant="dark" expand="lg" className="shadow">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard">
          <i className="fas fa-tint me-2"></i> Blood Stock Management
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              active={location.pathname === '/dashboard'}
            >
              <i className="fas fa-home me-2"></i>หน้าหลัก
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/blood-inventory"
              active={location.pathname === '/blood-inventory'}
            >
              <i className="fas fa-warehouse me-2"></i>คลังเลือด
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/blood-reservation-list"
              active={location.pathname === '/blood-reservation-list'}
            >
              <i className="fas fa-list me-2"></i>จองเลือด / ขอเลือด
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/pending-dispense"
              active={location.pathname === '/pending-dispense'}
            >
              <i className="fas fa-clock me-2"></i>จ่ายเลือด
            </Nav.Link>
          </Nav>
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle className="btn btn-light" id="dropdown-basic">
                <i className="fas fa-user me-2"></i>{user?.username}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="#profile"><i className="fas fa-user-circle me-2"></i>โปรไฟล์</Dropdown.Item>
                <Dropdown.Item href="#settings"><i className="fas fa-cog me-2"></i>การตั้งค่า</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>ออกจากระบบ</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;