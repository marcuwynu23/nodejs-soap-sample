import * as soap from 'soap';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Types for the SOAP service
interface HelloArgs {
  name: string;
}

interface HelloResponse {
  greeting: string;
}

// Simple SOAP service - just one operation
const service = {
  HelloService: {
    HelloPort: {
      Hello: function (args: HelloArgs): HelloResponse {
        return { greeting: 'Hello, ' + args.name + '!' };
      }
    }
  }
} as const;

// Minimal WSDL
const wsdl = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="HelloService"
  targetNamespace="http://example.com/hello"
  xmlns:tns="http://example.com/hello"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns="http://schemas.xmlsoap.org/wsdl/">

  <types>
    <xsd:schema targetNamespace="http://example.com/hello">
      <xsd:element name="HelloRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="name" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>

      <xsd:element name="HelloResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="greeting" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="HelloRequestMessage">
    <part name="parameters" element="tns:HelloRequest"/>
  </message>
  <message name="HelloResponseMessage">
    <part name="parameters" element="tns:HelloResponse"/>
  </message>

  <portType name="HelloPortType">
    <operation name="Hello">
      <input message="tns:HelloRequestMessage"/>
      <output message="tns:HelloResponseMessage"/>
    </operation>
  </portType>

  <binding name="HelloBinding" type="tns:HelloPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="Hello">
      <soap:operation soapAction="Hello"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="HelloService">
    <port name="HelloPort" binding="tns:HelloBinding">
      <soap:address location="http://localhost:8000/hello"/>
    </port>
  </service>
</definitions>`;

// HTTP server
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Serve HTML
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, '..', 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Serve WSDL
  if (req.url === '/hello?wsdl') {
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(wsdl);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Start server
const PORT = 8000;
soap.listen(server, '/hello', service as any, wsdl);
server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`SOAP: http://localhost:${PORT}/hello`);
  console.log(`WSDL: http://localhost:${PORT}/hello?wsdl`);
});
