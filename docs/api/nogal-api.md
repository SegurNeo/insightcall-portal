# **Documentación de la API de Seguros Nogal**

Esta API permite la interacción con el sistema de Seguros Nogal para la gestión de clientes, tickets e incidencias.

## **Requisitos Previos**

Es indispensable que el proveedor que realice las llamadas a la API proporcione a Seguros Nogal la IP, lista o rango de IPs desde las que se van a realizar las conexiones. Existe una validación de IP previa.

## **Endpoints de la API**

La API funciona mediante llamadas POST a URLs específicas, enviando un cuerpo JSON con los datos necesarios.

### **1\. Buscar Cliente**

Permite buscar información de un cliente en el sistema.

* **URL:** https://datahub.segurosnogal.es:4443/api/buscar-cliente  
* **Método:** POST  
* **Body JSON:**  
  {  
    "JsonId": "(Identificador único para la búsqueda)",  
    "Fecha envío": "(Formato DD/MM/YYYY)",  
    "Hora envío": "(Hora de envío)",  
    "IdLlamada": "(Identificador de la llamada)",  
    "Teléfono": "(Número de teléfono para búsqueda)",  
    "DNI": "(Documento de identidad para búsqueda)",  
    "Nombre": "(Nombre del cliente para búsqueda)",  
    "Email": "(Email del cliente para búsqueda)"  
  }

* **Respuestas Posibles:** La API devuelve una respuesta en formato JSON con los datos encontrados (clientes, pólizas, incidencias abiertas).

| Código | Descripción |
| :---- | :---- |
| 400 | No se recibieron datos suficientes para realizar la búsqueda. |
| 404 | Error en la solicitud, comúnmente por una URL incorrecta. |
| 500 | Error interno del servidor o la base de datos se encuentra inoperativa. |
| 200 | La solicitud ha sido correcta y se devuelve un JSON con los resultados. |

* **Ejemplo de Respuesta (Éxito \- Código 200):**  
  {  
    "datos": {  
      "clientes": \[  
        {  
          "campaña": "",  
          "codigo\_cliente": "831500F00",  
          "email\_cliente": "rfranfuria@gmail.com",  
          "nif\_cliente": "50154227J",  
          "nombre\_cliente": "FRANCISCO JOSE ROMERO MOYA",  
          "telefono\_1": "699169563",  
          "telefono\_2": "",  
          "telefono\_3": ""  
        }  
      \],  
      "detalle\_polizas": \[  
        {  
          "codigo\_cliente": "831500F00",  
          "poliza": "0119\_000343/000"  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "matricula": "9789JDR",  
          "modelo": "Koleos",  
          "poliza": "135869899"  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "poliza": "508974"  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "codigo\_postal": "28983",  
          "direccion": "PLANETA TIERRA",  
          "direccion\_ampliada": "",  
          "escalera": "",  
          "localidad": "PARLA",  
          "numero": "40",  
          "piso": "3",  
          "poliza": "8172000073799",  
          "portal": "",  
          "provincia": "28",  
          "puerta": "B",  
          "via": "CL"  
        }  
      \],  
      "incidencias": \[  
        {  
          "codigo\_cliente": "831500F00",  
          "codigo\_incidencia": "NG3274740",  
          "fecha\_creacion\_incidencia": "23.05.25",  
          "hora\_creacion\_incidencia": "10.43.32 am",  
          "motivo\_de\_incidencia": "LLam gestin comerc",  
          "poliza": "135869899",  
          "tipo\_de\_incidencia": "Llamada gestin comercial",  
          "via\_recepcion": "Teléfono \- Cliente"  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "codigo\_incidencia": "NG3276744",  
          "fecha\_creacion\_incidencia": "26.05.25",  
          "hora\_creacion\_incidencia": "12.35.48 pm",  
          "motivo\_de\_incidencia": "Retención \- Modif datos pliza",  
          "poliza": "135869899",  
          "tipo\_de\_incidencia": "Modificación póliza emitida",  
          "via\_recepcion": "Incidencia previa"  
        }  
      \],  
      "tipo\_busqueda": "T",  
      "valor\_busqueda": "699169563",  
      "vtos\_polizas": \[  
        {  
          "codigo\_cliente": "831500F00",  
          "compañia": "Reale",  
          "estado": "Póliza cancelada",  
          "fecha\_efecto": "01.07.20",  
          "importe\_poliza": "4,00",  
          "mes\_vencimiento": "Julio",  
          "poliza": "0119\_000343/000",  
          "poliza/suplemento": "Póliza",  
          "reemplaza\_a": ""  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "compañia": "ZURICH",  
          "estado": "Contratada",  
          "fecha\_efecto": "01.04.24",  
          "importe\_poliza": "556,49",  
          "mes\_vencimiento": "Abril",  
          "poliza": "135869899",  
          "poliza/suplemento": "Póliza",  
          "reemplaza\_a": ""  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "compañia": "AURA",  
          "estado": "Contratada",  
          "fecha\_efecto": "01.04.24",  
          "importe\_poliza": "114,67",  
          "mes\_vencimiento": "Abril",  
          "poliza": "567313",  
          "poliza/suplemento": "Póliza",  
          "reemplaza\_a": ""  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "compañia": "REALE",  
          "estado": "Reemplazada",  
          "fecha\_efecto": "15.08.20",  
          "importe\_poliza": "190,90",  
          "mes\_vencimiento": "Agosto",  
          "poliza": "8172000055241",  
          "poliza/suplemento": "Póliza",  
          "reemplaza\_a": ""  
        },  
        {  
          "codigo\_cliente": "831500F00",  
          "compañia": "REALE",  
          "estado": "Contratada",  
          "fecha\_efecto": "13.09.20",  
          "importe\_poliza": "190,80",  
          "mes\_vencimiento": "Septiembre",  
          "poliza": "8172000073799",  
          "poliza/suplemento": "Póliza",  
          "reemplaza\_a": "8172000055241"  
        }  
      \]  
    },  
    "jsonid": "1",  
    "mensaje": "Búsqueda realizada exitosamente",  
    "registros\_encontrados": {  
      "clientes": 1,  
      "detalle\_polizas": 5,  
      "incidencias": 2,  
      "vtos\_polizas": 5  
    },  
    "total\_registros": 13  
  }

### **2\. Crear Cliente**

Permite registrar un nuevo cliente en el sistema.

* **URL:** https://datahub.segurosnogal.es:4443/api/crear-cliente  
* **Método:** POST  
* **Body JSON:**  
  {  
    "Fecha envío": "(Formato DD/MM/YYYY)",  
    "Hora envío": "(Hora de envío)",  
    "IdCliente": "(Identificador del cliente)",  
    "Nombre": "(Nombre del cliente)",  
    "PrimerApellido": "(Primer apellido del cliente)",  
    "SegundoApellido": "(Segundo apellido del cliente)",  
    "Teléfono": "(Principal número de teléfono del cliente)",  
    "Teléfono2": "(Segundo número de teléfono del cliente en caso de que tenga)",  
    "Email": "(Email del cliente)",  
    "RecomendadoPor": "()",  
    "Campaña": "(Nombre de la campaña)"  
  }

* **Respuestas Posibles:** Las mismas que para "Buscar Cliente".  
* **Ejemplo de Respuesta (Éxito):**  
  {  
    "Respuesta": "OK"  
  }

### **3\. Crear Ticket**

Permite generar un nuevo ticket de incidencia en el sistema.

* **URL:** https://datahub.segurosnogal.es:4443/api/crear-ticket  
* **Método:** POST  
* **Body JSON:**  
  {  
    "Fecha envío": "(Formato DD/MM/YYYY)",  
    "Hora envío": "(Hora de envío)",  
    "IdCliente": "(Identificador del cliente)",  
    "IdTicket": "(Identificador del ticket)",  
    "TipoIncidencia": "(Tipo de incidencia por la que se creará el ticket)",  
    "MotivoIncidencia": "(Motivo de la incidencia)",  
    "NumeroPoliza": "(Número de la póliza por la que se abrirá la incidencia)",  
    "Notas": "(Resumen de la llamada)",  
    "FicheroLlamada": "(Nombre del fichero de la llamada)"  
  }

* **Respuestas Posibles:** Las mismas que para "Buscar Cliente".  
* **Ejemplo de Respuesta (Éxito):**  
  {  
    "Respuesta": "OK"  
  }

### **4\. Crear Rellamada**

Permite programar una rellamada en el sistema.

* **URL:** https://datahub.segurosnogal.es:4443/api/crear-rellamada  
* **Método:** POST  
* **Body JSON:**  
  {  
    "Fecha envío": "(Formato DD/MM/YYYY)",  
    "Hora envío": "(Hora de envío)",  
    "IdCliente": "(Identificador del cliente)",  
    "IdTicket": "(Identificador del ticket)",  
    "Notas": "(Resumen de la llamada)",  
    "FicheroLlamada": "(Nombre del fichero de la llamada)"  
  }

* **Respuestas Posibles:** Las mismas que para "Buscar Cliente".  
* **Ejemplo de Respuesta (Éxito):**  
  {  
    "Respuesta": "OK"  
  }  
