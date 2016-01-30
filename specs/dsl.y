/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
"var"                 {return 'VAR';}
"new"                 {return 'NEW';}
"="                   {return '='}
"("                   {return '('}
")"                   {return ')'}
\"[^\"]*\"            {return 'STRING';}
\w+                   {return 'WORD';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start seq

%% /* language grammar */

seq : EXPR EOF
      { return $1; }
    | EXPR seq
      {return $1 + '\n' + $2 }
    ;

EXPR: DECLARATION
    | DEPLOYMENT
    | STRING
    ;


DECLARATION: VAR WORD "=" EXPR
           { $$ = yy.assign( $WORD, $EXPR ); }
           ;

DEPLOYMENT: NEW WORD "(" ")"
           { $$ = yy.deploy( $WORD, [], 0, undefined ); }
          | NEW WORD "(" ARGS ")"
           { $$ = yy.deploy( $WORD, $ARGS, 0, undefined ); }
          ;

ARGS: WORD
    { $$ = [$WORD]; }
    | WORD ',' ARGS
    { $$ = [$WORD].concat($ARGS) }
    ;

