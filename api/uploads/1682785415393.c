//lab02.c
#include<stdio.h>
#include<math.h>
#include<GLUT/glut.h>

#define Pi 3.141592654


//vertex array
typedef struct POINT{
    GLfloat x;
    GLfloat y;
} Point;

#define POINTS_VERTEX_NUM 12
#define CIRCLE_VERTEX_NUM 72
Point points_vertexes[POINTS_VERTEX_NUM];
Point circle_vertexes[CIRCLE_VERTEX_NUM];

int hours,mins;

//function declerations
void Deg2Vector(float VecDeg, float VecSize, Point *p);
float Deg2Rad(float deg);
void drawingCB(void);
void reshapeCB(int width, int height);
void drawClock(int hours, int min);



int main(int argc, char *argv[])
{
    //initializing points and circle array
    int n;
    for(n=0 ; n<POINTS_VERTEX_NUM ; n++){
        Deg2Vector( (n+1)*360/POINTS_VERTEX_NUM, 0.7 ,&points_vertexes[n]);
    }
    for(n=0 ; n<CIRCLE_VERTEX_NUM ; n++){
        Deg2Vector( (n+1)*360/CIRCLE_VERTEX_NUM, 0.9 ,&circle_vertexes[n]);
    }
    
    hours = 9;
    mins = 30;

    //initizlizing GLUT
    glutInit(&argc,argv);

    //initializing window
    glutInitWindowPosition(100,100);
    glutInitWindowSize(400,400);
    glutInitDisplayMode(GLUT_RGB);
    glutCreateWindow("Clock");

    //registering callbacks
    glutDisplayFunc(drawingCB);
    glutReshapeFunc(reshapeCB);

    //starting main loop
    glutMainLoop();
}

// create vector from angle and size of vector
void Deg2Vector(float VecDeg, float VecSize, Point *p)
{
    p->x = (GLfloat) cos(Deg2Rad(VecDeg)) * VecSize;
    p->y = (GLfloat) sin(Deg2Rad(VecDeg)) * VecSize;
}

// convert degree to radians
float Deg2Rad(float deg)
{
    return deg*Pi/180.0;
}

// rendering callback
void drawingCB()
{
    GLenum er;
    GLfloat ModelviewMatrix[16];
    GLfloat ProjectionMatrix[16];

    //clearing the background
    glClearColor(0.2f, 0.8f, 0.7f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);

    //initializing modelview transformation matrix
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();

    //drawing clock 1
    glTranslated(1.5, 1.5, 0);
    drawClock(hours, mins);

    //drawing clock 2
    glTranslated(-3, 0, 0);
    drawClock(hours + 1, mins + 10);

    //drawing clock 3
    glTranslated(0, -3, 0);
    drawClock(hours + 3, mins + 30);

    //drawing clock 4
    glTranslated(3, 0, 0);
    drawClock(hours + 2, mins + 20);

    //checking transformation matrixes for debuging
    glGetFloatv(GL_MODELVIEW_MATRIX, ModelviewMatrix);
    glGetFloatv(GL_PROJECTION_MATRIX, ProjectionMatrix);

    //forces execution of OpenGL functions in finite time
    glFlush();

    //check for errors
    er = glGetError();  //get errors. 0 for no error, find the error codes in: https://www.opengl.org/wiki/OpenGL_Error
    if (er) printf("error: %d\n", er);
}

void drawClock(int hr, int min) {
    
    int n;
    float hrDeg = 360 / 12 * hr;
    float minDeg = 360 / 60 * min;

    //drawing points
    glColor3f(0.1f, 0.5f, 0.1f);
    glPointSize(4);
    glBegin(GL_POINTS);
    for (n = 0; n<POINTS_VERTEX_NUM; n++){
        glVertex2f(points_vertexes[n].x, points_vertexes[n].y);
    }
    glEnd();

    //drawing circle
    glLineWidth(2);
    glColor3f(0.1f, 0.4f, 0.8f);
    glBegin(GL_LINE_LOOP);
    for (n = 0; n<CIRCLE_VERTEX_NUM; n++){
        glVertex2f(circle_vertexes[n].x, circle_vertexes[n].y);
    }
    glEnd();

    //drawing middle point
    glColor3f(0.1f, 0.5f, 0.1f);
    glPointSize(6);
    glBegin(GL_POINTS);
    glVertex2f(0, 0);
    glEnd();

    //drawing clock lines
    glColor3f(0.0f, 0.0f, 0.8f);

    glRotatef(-hrDeg, 0, 0, 1);
    glBegin(GL_LINES);
    glVertex2f(0, 0);
    glVertex2f(0, 0.4);
    glEnd();
    glRotatef(hrDeg, 0, 0, 1);

    glRotatef(-minDeg, 0, 0, 1);
    glBegin(GL_LINES);
    glVertex2f(0, 0);
    glVertex2f(0, 0.6);
    glEnd();
    glRotatef(minDeg, 0, 0, 1);
}


void reshapeCB(int width, int height)
{
    GLfloat ModelviewMatrix[16];
    GLfloat ProjectionMatrix[16];
    float left,right,bottom,top;
    float AR;
    
    //define boundaries
    left=-3;
    right=3;
    bottom=-3;
    top=3;

    //update viewport
    glViewport(0,0,width,height);
 
    glMatrixMode(GL_PROJECTION);
    //clear the transformation matrices (load identity)
    glLoadIdentity();
    
    //compute the aspect ratio
    AR = (float)width/height;
    
    //if AR>=1 update left, right
    if(AR>=1)
    {
        left=left*AR;
        right=right*AR;
    }
    //else i.e. AR<1 update the top, bottom
    else
    {
        top=top/AR;
        bottom=bottom/AR;
    }
    //projection or gluOrtho2D
    gluOrtho2D(left,right,bottom,top);
    
    //checking transformation matrixes for debuging
    glGetFloatv(GL_MODELVIEW_MATRIX, ModelviewMatrix);
    glGetFloatv(GL_PROJECTION_MATRIX, ProjectionMatrix);
}
